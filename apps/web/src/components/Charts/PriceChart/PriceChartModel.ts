import { GraphQLApi } from '@universe/api'
import {
  AreaData,
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
import { opacify } from 'ui/src/theme'
import { getLowVarianceAxisDecimals, isLowVarianceRange } from 'uniswap/src/components/charts/utils'
import {
  ChartHoverData,
  ChartModel,
  ChartModelParams,
  DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
  DEFAULT_TOP_PRICE_SCALE_MARGIN,
} from '~/components/Charts/ChartModel'
import {
  RoundedCandleSeries,
  RoundedCandleSeriesOptions,
} from '~/components/Charts/PriceChart/RoundedCandlestickSeries/rounded-candles-series'
import { formatPriceAxisLabel, getCandlestickPriceBounds } from '~/components/Charts/PriceChart/utils'
import { PriceChartType } from '~/components/Charts/utils'

export type PriceChartData = CandlestickData<UTCTimestamp> & AreaData<UTCTimestamp>

interface PriceChartModelParams extends ChartModelParams<PriceChartData> {
  type: PriceChartType
  timePeriod?: GraphQLApi.HistoryDuration
  hideYAxis?: boolean
  hideXAxis?: boolean
  yAxisFormatter?: (price: number) => string
  sparkline?: boolean
  hideMinMaxLines?: boolean
  v2HoverStyles?: boolean
}

const LOW_PRICE_RANGE_THRESHOLD = 0.2
const LOW_PRICE_RANGE_SCALE_FACTOR = 1000000000

export class PriceChartModel extends ChartModel<PriceChartData> {
  protected series: ISeriesApi<'Area'> | ISeriesApi<'Custom'>
  private originalData: PriceChartData[]
  private lowPriceRangeScaleFactor = 1
  private priceAxisDecimals: number | undefined
  private type: PriceChartType
  private timePeriod?: GraphQLApi.HistoryDuration
  private minPriceLine: IPriceLine | undefined
  private maxPriceLine: IPriceLine | undefined
  private priceLineOptions: Partial<PriceLineOptions> | undefined
  private min: number
  private max: number
  private hideMinMaxLines = false

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
   * Gets the screen coordinates for the hovered data point on the line
   * Returns null if not hovering or for candlestick charts
   */
  override getHoverCoordinates(): { x: number; y: number } | null {
    // Only show custom marker for line charts
    if (this.type === PriceChartType.CANDLESTICK) {
      return null
    }

    const hoverData = (this as any)._hoverData
    if (!hoverData || !hoverData.item) {
      return null
    }

    // Calculate x from time
    const xCoordinate = this.api.timeScale().timeToCoordinate(hoverData.item.time)
    // Calculate y from the data point's value (not mouse position)
    const yCoordinate = this.series.priceToCoordinate((hoverData.item as AreaData<UTCTimestamp>).value)

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

    const { adjustedData, lowPriceRangeScaleFactor, min, max, priceAxisDecimals } = PriceChartModel.getAdjustedPrices(
      params.data,
    )
    this.data = adjustedData
    this.lowPriceRangeScaleFactor = lowPriceRangeScaleFactor
    this.min = min
    this.max = max
    this.priceAxisDecimals = priceAxisDecimals

    this.type = params.type
    this.timePeriod = params.timePeriod
    this.series =
      this.type === PriceChartType.LINE ? this.api.addAreaSeries() : this.api.addCustomSeries(new RoundedCandleSeries())
    this.series.setData(this.data)
    this.updateOptions(params)
    this.fitContent()
  }

  private static applyPriceScaleFactor(data: PriceChartData, scaleFactor: number): PriceChartData {
    return {
      time: data.time,
      value: (data.value || data.close) * scaleFactor,
      open: data.open * scaleFactor,
      close: data.close * scaleFactor,
      high: data.high * scaleFactor,
      low: data.low * scaleFactor,
    }
  }

  private static getAdjustedPrices(data: PriceChartData[]) {
    let lowPriceRangeScaleFactor = 1
    let adjustedData = data
    let { min, max } = getCandlestickPriceBounds(data)

    // Derived from the original bounds — the axis formatter receives unscaled prices.
    const priceAxisDecimals = getLowVarianceAxisDecimals(min, max)

    // Lightweight-charts shows few price-axis points for low-value/volatility tokens,
    // so we workaround by "scaling" the prices, causing more price-axis points to be shown
    if (max - min < LOW_PRICE_RANGE_THRESHOLD) {
      lowPriceRangeScaleFactor = LOW_PRICE_RANGE_SCALE_FACTOR
      adjustedData = data.map((point) => this.applyPriceScaleFactor(point, lowPriceRangeScaleFactor))
      min = min * lowPriceRangeScaleFactor
      max = max * lowPriceRangeScaleFactor
    }

    return { adjustedData, lowPriceRangeScaleFactor, min, max, priceAxisDecimals }
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
      sparkline,
      hideMinMaxLines,
      v2HoverStyles,
    } = params
    this.hideMinMaxLines = hideMinMaxLines ?? false
    const { min, max } = getCandlestickPriceBounds(data)

    // Handles changes in time period
    if (this.timePeriod !== params.timePeriod) {
      this.timePeriod = params.timePeriod
    }

    const shouldZoomOut = isLowVarianceRange({ min, max, duration: this.timePeriod })

    // Zoom out y-axis for low-variance assets
    const scaleMargins = shouldZoomOut
      ? {
          top: 0.49,
          bottom: 0.49,
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
      },
      rightPriceScale: {
        borderVisible: false,
        ...(hideYAxis && { visible: false, minimumWidth: 0 }),
        scaleMargins,
      },
    })

    // Handles changing between line/candlestick view
    if (this.type !== type) {
      this.type = params.type
      this.api.removeSeries(this.series)
      if (this.type === PriceChartType.CANDLESTICK) {
        this.series = this.api.addCustomSeries(new RoundedCandleSeries())
      } else {
        this.series = this.api.addAreaSeries()
      }
      this.series.setData(this.data)
    }
    // Handles changes in data, e.g. time period selection
    if (this.originalData !== data) {
      this.originalData = data
      // oxlint-disable-next-line no-shadow
      const { adjustedData, lowPriceRangeScaleFactor, min, max, priceAxisDecimals } =
        PriceChartModel.getAdjustedPrices(data)
      this.data = adjustedData
      this.lowPriceRangeScaleFactor = lowPriceRangeScaleFactor
      this.min = min
      this.max = max
      this.priceAxisDecimals = priceAxisDecimals

      this.series.setData(this.data)
      this.fitContent()
    }

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
