import {
  BarPrice,
  CrosshairMode,
  createChart,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  LineStyle,
  Logical,
  TimeChartOptions,
} from 'lightweight-charts'
import { ColorTokens, useSporeColors } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { uuid } from 'utilities/src/primitives/uuid'
import { PROTOCOL_LEGEND_ELEMENT_ID, SeriesDataItemType } from '~/components/Charts/types'
import { formatTickMarks } from '~/components/Charts/utils'

export const DEFAULT_TOP_PRICE_SCALE_MARGIN = 0.32
export const DEFAULT_BOTTOM_PRICE_SCALE_MARGIN = 0.15

export interface ChartUtilParams<TDataType extends SeriesDataItemType> {
  locale: string
  colors: ReturnType<typeof useSporeColors>
  format: ReturnType<typeof useLocalizationContext>
  isLargeScreen: boolean
  onCrosshairMove?: (data: TDataType | undefined) => void
}

export interface ChartDataParams<TDataType extends SeriesDataItemType> {
  color?: ColorTokens
  data: TDataType[]
  /** Repesents whether `data` is stale. If true, stale UI will appear */
  stale?: boolean
  hideTooltipBorder?: boolean
  tokenFormatType?: NumberType
}

export type ChartModelParams<TDataType extends SeriesDataItemType> = ChartUtilParams<TDataType> &
  ChartDataParams<TDataType>

export type ChartHoverData<TDataType extends SeriesDataItemType> = {
  item: TDataType
  x: number
  y: number
  logicalIndex: Logical
}

/** Util for managing lightweight-charts' state outside of the React Lifecycle. */
export abstract class ChartModel<TDataType extends SeriesDataItemType> {
  protected api: IChartApi
  protected abstract series: ISeriesApi<any>
  protected data: TDataType[]
  protected chartDiv: HTMLDivElement
  protected onCrosshairMove?: (data: TDataType | undefined, index: number | undefined) => void
  private _hoverData?: ChartHoverData<TDataType> | undefined
  private _lastTooltipWidth: number | null = null

  // Store handler reference for cleanup
  private wheelHandler = (event: WheelEvent): void => {
    if (event.ctrlKey) {
      event.preventDefault()
      event.stopPropagation()
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
      const timeScale = this.api.timeScale()
      const visibleRange = timeScale.getVisibleLogicalRange()
      if (visibleRange) {
        const center = (visibleRange.from + visibleRange.to) / 2
        const newHalfRange = ((visibleRange.to - visibleRange.from) / 2) * (1 / zoomFactor)
        timeScale.setVisibleLogicalRange({ from: center - newHalfRange, to: center + newHalfRange })
      }
    }
  }

  public tooltipId = `chart-tooltip-${uuid()}`

  /** Get current hover coordinates for custom marker rendering */
  public getHoverCoordinates(): { x: number; y: number } | null {
    if (!this._hoverData) {
      return null
    }
    // Adjust x coordinate to account for price scale width
    return {
      x: this._hoverData.x + this.api.priceScale('left').width(),
      y: this._hoverData.y,
    }
  }

  /** Right edge of the plot area (excludes the price axis), in the same coordinate space as getHoverCoordinates. */
  public getPlotRightEdge(): number {
    return this.api.priceScale('left').width() + this.api.paneSize().width
  }

  /** Check if chart is zoomed in (visible range is smaller than total data range) */
  public isZoomed(): boolean {
    const visibleRange = this.api.timeScale().getVisibleLogicalRange()
    if (!visibleRange || this.data.length === 0) {
      return false
    }
    const totalDataPoints = this.data.length
    const visibleDataPoints = visibleRange.to - visibleRange.from
    // Consider zoomed if showing less than 95% of data (small buffer for edge cases)
    return visibleDataPoints < totalDataPoints * 0.95
  }

  /** Subscribe to visible range changes (for zoom detection) */
  public subscribeToVisibleRangeChange(callback: () => void): () => void {
    this.api.timeScale().subscribeVisibleLogicalRangeChange(callback)
    return () => this.api.timeScale().unsubscribeVisibleLogicalRangeChange(callback)
  }

  constructor(chartDiv: HTMLDivElement, params: ChartModelParams<TDataType>) {
    this.chartDiv = chartDiv
    this.onCrosshairMove = params.onCrosshairMove
    this.data = params.data

    // Disable mouse wheel to allow page scrolling; pinch handled via custom wheel listener below
    this.api = createChart(chartDiv, {
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: false, pinch: true, axisPressedMouseMove: false },
    })

    // Custom wheel handler: pinch-to-zoom (Ctrl+wheel) while allowing page scroll
    chartDiv.addEventListener('wheel', this.wheelHandler, { passive: false, capture: true })

    this.api.subscribeCrosshairMove((param) => {
      let newHoverData: ChartHoverData<TDataType> | undefined
      const logical = param.logical
      const x = param.point?.x
      const y = param.point?.y

      if (
        x !== undefined &&
        isBetween(x, 0, this.chartDiv.clientWidth) &&
        y !== undefined &&
        isBetween(y, 0, this.chartDiv.clientHeight) &&
        logical !== undefined
      ) {
        const item = param.seriesData.get(this.series) as TDataType | undefined
        if (item) {
          newHoverData = { item, x, y, logicalIndex: logical }
        }
      }

      const prevHoverData = this._hoverData
      if (
        newHoverData?.item.time !== prevHoverData?.item.time ||
        newHoverData?.logicalIndex !== prevHoverData?.logicalIndex ||
        newHoverData?.x !== prevHoverData?.x ||
        newHoverData?.y !== prevHoverData?.y
      ) {
        this._hoverData = newHoverData
        // Dynamically accesses this.onCrosshairMove rather than params.onCrosshairMove so we only ever have to make one subscribeCrosshairMove call
        this.onSeriesHover(newHoverData)
      }
    })
  }

  /**
   * Updates React state with the current crosshair data.
   * This method should be overridden in subclasses to provide specific hover functionality.
   * When overriding, call `super.onSeriesHover(data)` to maintain base functionality.
   */
  protected onSeriesHover(hoverData?: ChartHoverData<TDataType>) {
    this.onCrosshairMove?.(hoverData?.item, hoverData?.logicalIndex)

    if (!hoverData) {
      return
    }

    // Tooltip positioning modified from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/plugins/tooltip/tooltip.ts
    const x = hoverData.x + this.api.priceScale('left').width() + 10
    const deadzoneWidth = this._lastTooltipWidth ? Math.ceil(this._lastTooltipWidth) : 45
    const xAdjusted = Math.min(x, this.api.paneSize().width - deadzoneWidth)

    const transformX = `calc(${xAdjusted}px)`

    const y = hoverData.y
    const flip = y <= 20 + 100
    // Add extra offset when in upper left to prevent cursor overlap
    const extraOffset = y < 50 && hoverData.x < 100 ? 10 : 0
    const yPx = y + (flip ? 1 : -1) * (20 + extraOffset)
    const yPct = flip ? '' : ' - 100%'
    const transformY = `calc(${yPx}px${yPct})`

    const tooltip = document.getElementById(this.tooltipId)
    const legend = document.getElementById(PROTOCOL_LEGEND_ELEMENT_ID)

    if (tooltip) {
      tooltip.style.transform = `translate(${transformX}, ${transformY})`

      const tooltipMeasurement = tooltip.getBoundingClientRect()
      this._lastTooltipWidth = tooltipMeasurement.width || null
    }
    if (legend) {
      // keep legend centered on mouse cursor if hovered
      legend.style.left = `${x}px`
      const heroWidth = 230
      // adjust height of tooltip if hovering below the hero text
      if (x < heroWidth) {
        legend.style.top = '80px'
      } else {
        legend.style.top = 'unset'
      }
      const transformOffset = 60
      const maxXOffset = this.api.paneSize().width - 40
      // keeps the legend centered on mouse x axis without getting cut off by chart edges
      if (x < transformOffset) {
        // Additional 4px of padding is added to prevent box-shadow from being cutoff
        legend.style.transform = `translateX(-${x - 4}%)`
      } else if (x > maxXOffset) {
        legend.style.transform = `translateX(-${transformOffset + (x - maxXOffset)}%)`
      } else {
        legend.style.transform = `translateX(-${transformOffset}%)`
      }
    }
  }

  /** Updates the chart without re-creating it or resetting pan/zoom. */
  public updateOptions(
    { locale, colors, format, isLargeScreen, onCrosshairMove }: ChartModelParams<TDataType>,
    nonDefaultChartOptions?: DeepPartial<TimeChartOptions>,
  ) {
    this.onCrosshairMove = onCrosshairMove

    // Below are default options that will apply to all Chart models that extend this class and call super.updateOptions().
    // Subclasses can override / extend these options by passing in nonDefaultChartOptions.
    const defaultOptions: DeepPartial<TimeChartOptions> = {
      localization: {
        locale,
        priceFormatter: (price: BarPrice) => format.convertFiatAmountFormatted(price, NumberType.FiatTokenPrice),
      },
      autoSize: true,
      layout: { textColor: colors.neutral2.val, background: { color: 'transparent' } },
      timeScale: {
        tickMarkFormatter: formatTickMarks,
        borderVisible: false,
        ticksVisible: false,
        timeVisible: true,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        visible: isLargeScreen,
        borderVisible: false,
        scaleMargins: {
          top: DEFAULT_TOP_PRICE_SCALE_MARGIN,
          bottom: DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
        },
        autoScale: true,
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
      crosshair: {
        horzLine: {
          visible: true,
          style: LineStyle.Solid,
          width: 1,
          color: colors.surface3.val,
          labelVisible: false,
        },
        mode: CrosshairMode.Magnet,
        vertLine: {
          visible: true,
          style: LineStyle.Solid,
          width: 1,
          color: colors.surface3.val,
          labelVisible: false,
        },
      },
      // Disable mouse wheel to allow page scrolling; pinch handled by custom wheel listener
      handleScroll: { mouseWheel: false, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: false, pinch: true, axisPressedMouseMove: false },
    }

    this.api.applyOptions({
      ...defaultOptions,
      ...nonDefaultChartOptions,
      timeScale: {
        ...defaultOptions.timeScale,
        ...nonDefaultChartOptions?.timeScale,
      },
    })
  }

  /** Updates visible range to fit all data from all series. */
  public fitContent() {
    this.api.timeScale().fitContent()
  }

  /** Removes the injected canvas from the chartDiv. */
  public remove() {
    this.chartDiv.removeEventListener('wheel', this.wheelHandler, { capture: true })
    this.api.remove()
  }
}

// oxlint-disable-next-line max-params
function isBetween(num: number, lower: number, upper: number): boolean {
  return num > lower && num < upper
}
