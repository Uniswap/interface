import { opacify } from '@universe/mycelium/theme-hooks-compat'
import {
  AreaData,
  AreaSeries,
  AreaSeriesPartialOptions,
  BarPrice,
  CandlestickData,
  CrosshairMode,
  IPriceLine,
  ISeriesApi,
  LineStyle,
  LineType,
  PriceLineOptions,
  UTCTimestamp,
} from 'lightweight-charts'
import { FLAT_STABLECOIN_HEIGHT_FRACTION, isLowVarianceRange } from 'uniswap/src/components/charts/utils'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import {
  ChartHoverData,
  ChartModel,
  ChartModelParams,
  DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
  DEFAULT_TOP_PRICE_SCALE_MARGIN,
} from '~/components/Charts/ChartModel'
import { LazyRangeBand } from '~/components/Charts/PriceChart/LazyRangeBand'
import { getAdjustedPrices } from '~/components/Charts/PriceChart/lowPriceScale'
import { getVisiblePriceWindow, PriceAxisFit } from '~/components/Charts/PriceChart/priceAxisFit'
import type { PriceWindow } from '~/components/Charts/PriceChart/priceWindow'
import {
  RoundedCandleSeries,
  RoundedCandleSeriesOptions,
} from '~/components/Charts/PriceChart/RoundedCandlestickSeries/rounded-candles-series'
import {
  formatPriceAxisLabel,
  formatPriceChartTickMark,
  getCandlestickPriceBounds,
} from '~/components/Charts/PriceChart/utils'
import { VolumeBarsOverlay } from '~/components/Charts/PriceChart/VolumeBarsOverlay'
import type { DraggableRange } from '~/components/Charts/rangeDrag'
import type { SingleHistogramData } from '~/components/Charts/VolumeChart/utils'
import { PriceChartData, PriceChartType } from '~/utils/charts'

/**
 * A price range highlighted across the chart, in the same units as the series. An undefined edge is open:
 * the band runs off the chart that way, with no line and no pull on the autoscale.
 */
export type PriceChartRangeBand = {
  lower?: number
  upper?: number
  lowerLabel: string
  upperLabel: string
}

interface PriceChartModelParams extends ChartModelParams<PriceChartData> {
  type: PriceChartType
  timePeriod?: HistoryDuration
  hideYAxis?: boolean
  hideXAxis?: boolean
  yAxisFormatter?: (price: number) => string
  yAxisTickmarksFormatter?: (prices: number[]) => string[]
  disableLowPriceRangeScaling?: boolean
  sparkline?: boolean
  hideMinMaxLines?: boolean
  v2HoverStyles?: boolean
  isStablecoin?: boolean
  rangeBand?: PriceChartRangeBand
  /** Makes the range band's edge lines draggable; called with the new range, in series units, on release. */
  onRangeBandChange?: (range: { lower?: number; upper?: number }) => void
  /** The range, in series units, as an edge line is dragged; undefined once the drag ends either way. */
  onRangeBandPreview?: (range: { lower?: number; upper?: number } | undefined) => void
  /** Pins the axis to these prices (series units) through range edits; undefined fits the data and band. */
  priceWindow?: PriceWindow
  /** Given a reader for the `priceWindow` that matches the axis now, so a first zoom starts from it. */
  visiblePriceWindowRef?: { current: (() => PriceWindow | undefined) | null }
  /** Changing it re-fits the axis to the data and the band as they stand, as setting new data does. */
  refitKey?: number
  /** Drawn as short bars along the bottom of the chart. */
  volumeData?: SingleHistogramData[]
  /** The hovered bar, as given in `volumeData`. */
  onVolumeBarHover?: (bar: SingleHistogramData | undefined) => void
}

export class PriceChartModel extends ChartModel<PriceChartData> {
  protected series: ISeriesApi<'Area'> | ISeriesApi<'Custom'>
  private originalData: PriceChartData[]
  protected lowPriceRangeScaleFactor = 1
  private priceAxisDecimals: number | undefined
  private type: PriceChartType
  private timePeriod?: HistoryDuration
  private minPriceLine: IPriceLine | undefined
  private maxPriceLine: IPriceLine | undefined
  private priceLineOptions: Partial<PriceLineOptions> | undefined
  private min: number
  private max: number
  private hideMinMaxLines = false
  private rangeBandOverlay: LazyRangeBand
  // Created with the first volume data, so price charts that never get any (TDP, sparklines) attach nothing.
  private volumeBars: VolumeBarsOverlay | undefined
  // The band as drawn, in plotted units: a drag starts from it.
  private plottedRangeBand: DraggableRange | undefined
  private onRangeBandChange: PriceChartModelParams['onRangeBandChange']
  private onRangeBandPreview: PriceChartModelParams['onRangeBandPreview']
  private readonly axisFit = new PriceAxisFit(() => super.isZoomed())
  private priceWindow: PriceWindow | undefined
  // The chart's zoom watchers: a pinned price window is a zoom the time scale doesn't report.
  private readonly zoomListeners = new Set<() => void>()
  private visiblePriceWindowRef: PriceChartModelParams['visiblePriceWindowRef']

  /**
   * Gets the screen coordinates for the last data point
   * Returns null for candlestick charts since they don't need a live dot indicator
   */
  getLastPointCoordinates(): { x: number; y: number } | null {
    // Only show live dot for line charts
    if (this.type === PriceChartType.CANDLESTICK) {
      return null
    }

    if (this.data.length === 0) {
      return null
    }

    const lastDataPoint = this.data[this.data.length - 1]
    const xCoordinate = this.api.timeScale().timeToCoordinate(lastDataPoint.time)
    const yCoordinate = this.series.priceToCoordinate((lastDataPoint as AreaData<UTCTimestamp>).value)

    if (xCoordinate == null || yCoordinate == null) {
      return null
    }

    return {
      x: Number(xCoordinate) + this.api.priceScale('left').width(),
      y: Number(yCoordinate),
    }
  }

  /**
   * Gets the screen coordinates for the hovered data point (a candle's close), or null if not hovering.
   * The custom hover marker only draws for line charts (`v2HoverStyles`), but overlays read the x for candles too.
   */
  override getHoverCoordinates(): { x: number; y: number } | null {
    const item = this._hoverData?.item
    if (!item) {
      return null
    }

    const xCoordinate = this.api.timeScale().timeToCoordinate(item.time)
    // From the data point's value (not the mouse position): a candle's close, or the line's value
    const yCoordinate = this.series.priceToCoordinate(
      this.type === PriceChartType.CANDLESTICK ? item.close : item.value,
    )

    if (xCoordinate == null || yCoordinate == null) {
      return null
    }

    return {
      x: Number(xCoordinate) + this.api.priceScale('left').width(),
      y: Number(yCoordinate),
    }
  }

  constructor(chartDiv: HTMLDivElement, params: PriceChartModelParams) {
    super(chartDiv, params)
    this.originalData = this.data

    const { adjustedData, lowPriceRangeScaleFactor, min, max, priceAxisDecimals } = getAdjustedPrices(
      params.data,
      params.disableLowPriceRangeScaling,
    )
    this.data = adjustedData
    this.lowPriceRangeScaleFactor = lowPriceRangeScaleFactor
    this.min = min
    this.max = max
    this.priceAxisDecimals = priceAxisDecimals

    this.type = params.type
    this.timePeriod = params.timePeriod
    this.series =
      this.type === PriceChartType.LINE
        ? this.api.addSeries(AreaSeries)
        : this.api.addCustomSeries(new RoundedCandleSeries())
    this.series.setData(this.data)
    this.rangeBandOverlay = new LazyRangeBand({
      chartDiv,
      api: this.api,
      getSeries: () => this.series,
      getRange: () => (this.onRangeBandChange ? this.plottedRangeBand : undefined),
      // The preview comes back snapped through the context, and that redraw is the only one per move.
      onPreview: (range) => this.onRangeBandPreview?.(this.toSeriesUnits(range)),
      onCommit: (range) => this.onRangeBandChange?.(this.toSeriesUnits(range)),
      onEnd: () => this.onRangeBandPreview?.(undefined),
    })
    this.updateOptions(params)
    this.fitContent()
  }

  /** A plotted range back in the series' own units, undoing the low-price scale-up. */
  private toSeriesUnits({ lower, upper }: DraggableRange): DraggableRange {
    return {
      lower: lower === undefined ? undefined : lower / this.lowPriceRangeScaleFactor,
      upper: upper === undefined ? undefined : upper / this.lowPriceRangeScaleFactor,
    }
  }

  private readonly getVisiblePriceWindow = (): PriceWindow | undefined =>
    getVisiblePriceWindow(this.series, this.lowPriceRangeScaleFactor)

  override remove(): void {
    if (this.visiblePriceWindowRef?.current === this.getVisiblePriceWindow) {
      this.visiblePriceWindowRef.current = null
    }
    this.rangeBandOverlay.remove()
    super.remove()
  }

  updateOptions(params: PriceChartModelParams) {
    const {
      data,
      colors,
      type,
      locale,
      format,
      tokenFormatType,
      hideYAxis,
      hideXAxis,
      yAxisFormatter,
      yAxisTickmarksFormatter,
      disableLowPriceRangeScaling,
      sparkline,
      hideMinMaxLines,
      v2HoverStyles,
      isStablecoin,
    } = params
    this.hideMinMaxLines = hideMinMaxLines ?? false
    const { min, max } = getCandlestickPriceBounds(data)
    this.visiblePriceWindowRef = params.visiblePriceWindowRef
    if (this.visiblePriceWindowRef) {
      this.visiblePriceWindowRef.current = this.getVisiblePriceWindow
    }

    // Handles changes in time period
    if (this.timePeriod !== params.timePeriod) {
      this.timePeriod = params.timePeriod
    }

    // A set window is the zoom, so it isn't squeezed into the middle as a flat series is.
    const shouldZoomOut =
      !params.priceWindow && isLowVarianceRange({ min, max, duration: this.timePeriod, isStablecoin })

    // Zoom out y-axis for low-variance assets
    const scaleMargins = shouldZoomOut
      ? {
          top: (1 - FLAT_STABLECOIN_HEIGHT_FRACTION) / 2,
          bottom: (1 - FLAT_STABLECOIN_HEIGHT_FRACTION) / 2,
        }
      : {
          top: DEFAULT_TOP_PRICE_SCALE_MARGIN,
          bottom: DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
        }

    const crosshairOverride = sparkline
      ? { crosshair: { mode: CrosshairMode.Hidden } }
      : type === PriceChartType.LINE && v2HoverStyles
        ? {
            crosshair: {
              horzLine: { visible: false, labelVisible: false },
              vertLine: { color: colors.surface3.val, style: LineStyle.Solid, labelVisible: false },
            },
          }
        : {}

    super.updateOptions(params, {
      timeScale: {
        visible: !sparkline && !hideXAxis,
        tickMarkFormatter: formatPriceChartTickMark,
      },
      ...crosshairOverride,
      localization: {
        locale,
        priceFormatter: (price: BarPrice) =>
          formatPriceAxisLabel({
            scaledPrice: Number(price),
            scaleFactor: this.lowPriceRangeScaleFactor,
            decimals: this.priceAxisDecimals,
            format,
            locale,
            yAxisFormatter,
            tokenFormatType,
          }),
        ...(yAxisTickmarksFormatter && {
          tickmarksPriceFormatter: (prices: BarPrice[]) =>
            yAxisTickmarksFormatter(prices.map((price) => Number(price) / this.lowPriceRangeScaleFactor)),
        }),
      },
      rightPriceScale: {
        borderVisible: false,
        visible: !hideYAxis,
        scaleMargins,
        entireTextOnly: true,
      },
    })

    // Handles changing between line/candlestick view
    if (this.type !== type) {
      this.type = params.type
      const previousSeries = this.series
      if (this.type === PriceChartType.CANDLESTICK) {
        this.series = this.api.addCustomSeries(new RoundedCandleSeries())
      } else {
        this.series = this.api.addSeries(AreaSeries)
      }
      this.rangeBandOverlay.reattach(this.series)
      this.api.removeSeries(previousSeries)
      this.series.setData(this.data)
      // The new series has no autoscale provider yet.
      this.axisFit.reset()
    }
    // Handles changes in data, e.g. time period selection
    if (this.originalData !== data) {
      this.originalData = data
      // oxlint-disable-next-line no-shadow
      const { adjustedData, lowPriceRangeScaleFactor, min, max, priceAxisDecimals } = getAdjustedPrices(
        data,
        disableLowPriceRangeScaling,
      )
      this.data = adjustedData
      this.lowPriceRangeScaleFactor = lowPriceRangeScaleFactor
      this.min = min
      this.max = max
      this.priceAxisDecimals = priceAxisDecimals

      this.series.setData(this.data)
      this.fitContent()
      // The band and window are re-fitted along with the new data, in its new plotted units.
      this.axisFit.reset()
    }

    if (params.volumeData?.length && !this.volumeBars) {
      this.volumeBars = new VolumeBarsOverlay(this.api)
    }
    this.volumeBars?.update({
      bars: params.volumeData,
      prices: this.data,
      colors,
      padEdges: this.type === PriceChartType.CANDLESTICK,
      onHover: params.onVolumeBarHover,
    })

    // Use colors.accent1 which will be the token color when inside TokenColorThemeProvider
    const lineColor = colors.accent1.val

    this.series.applyOptions({
      priceLineVisible: false,
      lastValueVisible: false,

      // Line-specific options:
      lineType: data.length < 20 ? LineType.WithSteps : LineType.Curved, // Stepped line is visually preferred for smaller datasets
      lineWidth: 2,
      lineColor,
      topColor: lineColor,
      bottomColor: opacify(0, colors.surface1.val),
      // Hide default marker - we use a custom marker instead
      crosshairMarkerRadius: 0,

      // Candlestick-specific options:
      upColor: colors.statusSuccess.val,
      wickUpColor: colors.statusSuccess.val,
      downColor: colors.statusCritical.val,
      wickDownColor: colors.statusCritical.val,
      borderVisible: false,
    } as Partial<RoundedCandleSeriesOptions> & AreaSeriesPartialOptions)

    this.priceLineOptions = {
      color: colors.surface3.val,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelColor: colors.surface3Solid.val,
      axisLabelTextColor: colors.neutral1.val,
    }
    this.minPriceLine?.applyOptions({ price: this.min, ...this.priceLineOptions })
    this.maxPriceLine?.applyOptions({ price: this.max, ...this.priceLineOptions })

    this.axisFit.setRefitKey(params.refitKey)
    this.updateRangeBand(params)
  }

  /** Zoomed in time, or pinned to a price window: the live dot hides, as it would sit off the visible axis. */
  override isZoomed(): boolean {
    return super.isZoomed() || this.priceWindow !== undefined
  }

  override subscribeToVisibleRangeChange(callback: () => void): () => void {
    const unsubscribe = super.subscribeToVisibleRangeChange(callback)
    this.zoomListeners.add(callback)
    return () => {
      unsubscribe()
      this.zoomListeners.delete(callback)
    }
  }

  private updateRangeBand({
    rangeBand,
    colors,
    onRangeBandChange,
    onRangeBandPreview,
    priceWindow,
  }: PriceChartModelParams): void {
    if (priceWindow !== this.priceWindow) {
      this.priceWindow = priceWindow
      this.zoomListeners.forEach((listener) => listener())
    }
    this.onRangeBandChange = onRangeBandChange
    this.onRangeBandPreview = onRangeBandPreview
    if (!rangeBand) {
      this.plottedRangeBand = undefined
      this.rangeBandOverlay.clear()
      this.axisFit.update(this.series, { window: priceWindow, scale: this.lowPriceRangeScaleFactor })
      return
    }

    // The series is plotted scaled up for low-value pairs (see getLowPriceRangeScaleFactor), so the band is too.
    const lower = rangeBand.lower === undefined ? undefined : rangeBand.lower * this.lowPriceRangeScaleFactor
    const upper = rangeBand.upper === undefined ? undefined : rangeBand.upper * this.lowPriceRangeScaleFactor
    this.drawRangeBand({ range: { lower, upper }, colors, rangeBand })
    // A full range has no edge to take in, so fitted fresh it keeps the series' own scale.
    const scale = this.lowPriceRangeScaleFactor
    this.axisFit.update(this.series, { window: priceWindow, band: { lower, upper }, scale })
  }

  /** Draws the band and its edge lines; the autoscale is left alone, so a dragged edge doesn't rescale under the pointer. */
  private drawRangeBand({
    range,
    colors,
    rangeBand: { lowerLabel, upperLabel },
  }: {
    range: DraggableRange
    colors: PriceChartModelParams['colors']
    rangeBand: PriceChartRangeBand
  }): void {
    this.plottedRangeBand = range
    this.rangeBandOverlay.draw({
      range,
      color: colors.accent1.val,
      labelTextColor: colors.white.val,
      lowerLabel,
      upperLabel,
    })
  }

  override onSeriesHover(hoverData?: ChartHoverData<CandlestickData>) {
    if (hoverData) {
      // Use original data point for hover functionality rather than data that has been scaled by lowPriceRangeScaleFactor
      const originalItem = this.originalData[hoverData.logicalIndex]
      const updatedHoverData = { ...hoverData, item: originalItem }
      super.onSeriesHover(updatedHoverData)
    } else {
      super.onSeriesHover(undefined)
    }

    // Hide/display price lines based on hover
    if (hoverData === undefined) {
      if (this.minPriceLine && this.maxPriceLine) {
        this.series.removePriceLine(this.minPriceLine)
        this.series.removePriceLine(this.maxPriceLine)
        this.minPriceLine = undefined
        this.maxPriceLine = undefined
      }
    } else if (!this.hideMinMaxLines && !this.minPriceLine && !this.maxPriceLine && this.min && this.max) {
      this.minPriceLine = this.series.createPriceLine({ price: this.min, ...this.priceLineOptions })
      this.maxPriceLine = this.series.createPriceLine({ price: this.max, ...this.priceLineOptions })
    }
  }
}
