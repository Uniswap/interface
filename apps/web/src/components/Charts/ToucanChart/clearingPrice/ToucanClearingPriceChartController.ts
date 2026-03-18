/* eslint-disable max-lines */
import type { IChartApi, ISeriesApi, MouseEventParams, Time, UTCTimestamp } from 'lightweight-charts'
import { logger } from 'utilities/src/logger/logger'
import { constrainVisibleRangeToBounds } from '~/components/Charts/ToucanChart/bidDistribution/utils/visibleRange'
import {
  createAreaSeriesOptions,
  createTimeScaleOptions,
} from '~/components/Charts/ToucanChart/clearingPrice/controller/chartOptions'
import { initClearingPriceChart } from '~/components/Charts/ToucanChart/clearingPrice/controller/lifecycle/init'
import { handleClearingPriceCrosshairMove } from '~/components/Charts/ToucanChart/clearingPrice/controller/logic/crosshairMove'
import type {
  ChartCoordinates,
  ClearingPriceChartControllerCreateParams,
  ClearingPriceChartControllerUpdateParams,
  ClearingPriceChartPoint,
  ClearingPriceZoomState,
} from '~/components/Charts/ToucanChart/clearingPrice/types'
import { createYAxisPriceFormatter } from '~/components/Charts/ToucanChart/clearingPrice/utils/priceFormatter'
import { calculateZoomedRange, getIsZoomed } from '~/components/Charts/ToucanChart/utils/zoomRange'
import { formatTickMarks } from '~/components/Charts/utils'
import { ZOOM_FACTORS } from '~/components/Toucan/Auction/BidDistributionChart/constants'

/**
 * Controller for the Clearing Price Chart.
 *
 * Responsibilities:
 * - Own lightweight-charts lifecycle (create/destroy + subscriptions)
 * - Handle crosshair/hover interactions
 * - Emit tooltip state changes to React layer
 *
 * Implementation style:
 * - Controller is intentionally "thin orchestration"; logic lives in controller/* modules.
 * - Follows the same pattern as ToucanBidDistributionChartController for consistency.
 */
export class ToucanClearingPriceChartController {
  private readonly createParams: ClearingPriceChartControllerCreateParams
  private readonly callbacks: ClearingPriceChartControllerCreateParams['callbacks']

  private chart: IChartApi | null = null
  private series: ISeriesApi<'Area'> | null = null
  private container: HTMLDivElement
  private teardownFn: (() => void) | null = null
  private subscribeVisibleRangeChangesFn: (() => void) | null = null
  private hasSubscribedVisibleRangeChanges = false
  private latestData: ClearingPriceChartControllerUpdateParams['data'] = []
  /** Whether to use logical range positioning (75% visible data width) */
  private useLogicalRangePositioning = false
  private isZoomEnabled = true
  private fullRangeStart: UTCTimestamp | null = null
  private fullRangeEnd: UTCTimestamp | null = null
  private initialRangeStart: UTCTimestamp | null = null
  private initialRangeEnd: UTCTimestamp | null = null
  private hoverCoordinates: ChartCoordinates | null = null
  private latestZoomState: ClearingPriceZoomState = {
    visibleRange: null,
    isZoomed: false,
  }

  constructor(params: ClearingPriceChartControllerCreateParams) {
    this.createParams = params
    this.callbacks = params.callbacks
    this.container = params.container
    this.init()
  }

  public destroy(): void {
    try {
      this.teardown()
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'ToucanClearingPriceChartController',
          function: 'destroy',
        },
      })
    }
  }

  /**
   * Gets the screen coordinates for the last data point.
   * Used by LiveDotRenderer to position the pulsing indicator.
   */
  public getLastPointCoordinates(): { x: number; y: number } | null {
    if (this.latestData.length === 0) {
      return null
    }

    // Safe to use non-null assertion since we checked length > 0 above
    const lastDataPoint = this.latestData[this.latestData.length - 1]!
    return this.getPointCoordinates(lastDataPoint)
  }

  /**
   * Gets the screen coordinates for the currently hovered data point.
   * Used by LiveDotRenderer to position the pulsing indicator on hover.
   */
  public getHoverPointCoordinates(): ChartCoordinates | null {
    return this.hoverCoordinates
  }

  /**
   * Fits chart content to visible area.
   * Used by LiveDotRenderer during resize.
   * Maintains 75% data positioning when logical range positioning is enabled.
   */
  public fitContent(): void {
    const chart = this.chart
    if (!chart) {
      return
    }

    // When using logical range positioning, maintain the 75% visible range instead of fitting all content
    if (this.useLogicalRangePositioning && this.latestData.length > 0) {
      const logicalEnd = Math.ceil(this.latestData.length / 0.75)
      chart.timeScale().setVisibleLogicalRange({ from: 0, to: logicalEnd })
    } else {
      chart.timeScale().fitContent()
    }
  }

  public update(params: ClearingPriceChartControllerUpdateParams): void {
    const chart = this.chart
    const series = this.series
    if (!chart || !series) {
      return
    }

    const {
      data,
      scaledYMin,
      scaledYMax,
      scaleFactor,
      maxFractionDigits,
      timeSpanDays,
      visibleRangeStart,
      visibleRangeEnd,
      fullRangeStart,
      fullRangeEnd,
      initialRangeStart,
      initialRangeEnd,
      tokenColor,
      useLogicalRangePositioning,
      hideXAxis,
      isZoomEnabled = true,
    } = params

    // Store positioning mode for coordinate calculations and resize handling
    this.useLogicalRangePositioning = useLogicalRangePositioning ?? false
    this.isZoomEnabled = isZoomEnabled

    /* eslint-disable @typescript-eslint/no-unnecessary-condition -- fallback chains for optional range params */
    const resolvedStart = fullRangeStart ?? visibleRangeStart ?? data[0]?.time ?? null
    const resolvedEnd = fullRangeEnd ?? visibleRangeEnd ?? data[data.length - 1]?.time ?? null
    this.initialRangeStart = initialRangeStart ?? visibleRangeStart ?? resolvedStart
    this.initialRangeEnd = initialRangeEnd ?? visibleRangeEnd ?? resolvedEnd
    this.fullRangeStart = this.initialRangeStart ?? resolvedStart
    this.fullRangeEnd = this.initialRangeEnd ?? resolvedEnd
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */

    const interactionOptions = isZoomEnabled
      ? {
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: false,
          },
          handleScale: {
            mouseWheel: true,
            pinch: true,
            axisPressedMouseMove: {
              time: true,
              price: false,
            },
          },
        }
      : {
          handleScroll: {
            mouseWheel: false,
            pressedMouseMove: false,
            horzTouchDrag: false,
            vertTouchDrag: false,
          },
          handleScale: {
            mouseWheel: false,
            pinch: false,
            axisPressedMouseMove: {
              time: false,
              price: false,
            },
          },
        }

    // Apply chart options including timeScale visibility
    chart.applyOptions({
      timeScale: {
        ...createTimeScaleOptions({
          colors: this.createParams.colors,
          timeSpanDays,
          useLogicalRangePositioning,
        }),
        tickMarkFormatter: formatTickMarks,
        // Hide x-axis when using two-chart overlay mode
        visible: !hideXAxis,
      },
      localization: {
        priceFormatter: createYAxisPriceFormatter({
          scaleFactor,
          maxFractionDigits,
        }),
      },
      ...interactionOptions,
    })

    // Set data and series options
    this.latestData = data
    series.setData(data)

    // Subscribe to visible range changes AFTER first setData to avoid lightweight-charts
    // internal errors when range change events fire before data is loaded.
    if (!this.hasSubscribedVisibleRangeChanges && this.subscribeVisibleRangeChangesFn) {
      this.subscribeVisibleRangeChangesFn()
      this.hasSubscribedVisibleRangeChanges = true
    }

    const seriesOptions = createAreaSeriesOptions({
      colors: this.createParams.colors,
      tokenColor: tokenColor ?? this.createParams.tokenColor,
      scaledYMin,
      scaledYMax,
    })
    series.applyOptions(seriesOptions)

    // Set visible range based on positioning mode
    // Wrap in try-catch because range operations can throw if chart's internal state isn't ready
    try {
      if (useLogicalRangePositioning && data.length > 0) {
        // Use logical range for 75% positioning (data occupies 75% of chart width)
        const logicalEnd = Math.ceil(data.length / 0.75)
        chart.timeScale().setVisibleLogicalRange({ from: 0, to: logicalEnd })
      } else if (visibleRangeStart !== undefined && visibleRangeEnd !== undefined) {
        // For ended auctions or two-chart mode, use time-based range
        chart.timeScale().setVisibleRange({ from: visibleRangeStart, to: visibleRangeEnd })
      } else {
        chart.timeScale().fitContent()
      }
    } catch {
      // Chart not ready yet - ignore the error
    }

    this.syncZoomStateFromChart()
  }

  private init(): void {
    try {
      const onCrosshairMove = (param: MouseEventParams<Time>) => this.onCrosshairMove(param)
      const onVisibleRangeChange = (range: { from: Time; to: Time } | null) => this.onVisibleRangeChange(range)
      const onResize = () => this.onResize()

      const result = initClearingPriceChart({
        createParams: this.createParams,
        container: this.container,
        onCrosshairMove,
        onVisibleRangeChange,
        onResize,
      })

      this.chart = result.chart
      this.series = result.series
      this.teardownFn = result.teardown
      this.subscribeVisibleRangeChangesFn = result.subscribeVisibleRangeChanges
    } catch (error) {
      logger.error(error, {
        tags: { file: 'ToucanClearingPriceChartController', function: 'init' },
      })
    }
  }

  private teardown(): void {
    const chart = this.chart
    if (!chart) {
      return
    }

    this.teardownFn?.()
    this.teardownFn = null

    chart.remove()
    this.chart = null
    this.series = null
  }

  private onResize(): void {
    if (!this.chart) {
      return
    }

    this.chart.applyOptions({
      width: this.container.clientWidth,
      height: this.createParams.height,
    })
    if (this.latestZoomState.visibleRange) {
      this.chart.timeScale().setVisibleRange(
        this.latestZoomState.visibleRange as {
          from: UTCTimestamp
          to: UTCTimestamp
        },
      )
      return
    }
    this.applyInitialRange()
  }

  private onCrosshairMove(param: MouseEventParams<Time>): void {
    const chart = this.chart
    const series = this.series
    if (!chart || !series) {
      return
    }

    const data = param.seriesData.get(series) as ClearingPriceChartPoint | undefined
    if (!param.point || !param.time || !data) {
      this.updateHoverCoordinates(null)
    } else {
      this.updateHoverCoordinates(this.getPointCoordinates(data))
    }

    handleClearingPriceCrosshairMove({
      param,
      chart,
      series,
      onTooltipStateChange: this.callbacks.onTooltipStateChange,
    })
  }

  private onVisibleRangeChange(range: { from: Time; to: Time } | null): void {
    if (!this.chart || !range || !this.fullRangeStart || !this.fullRangeEnd) {
      return
    }

    const from = range.from as number
    const to = range.to as number
    const fullRangeSize = this.fullRangeEnd - this.fullRangeStart
    const currentRangeSize = to - from
    if (currentRangeSize > fullRangeSize) {
      this.chart.timeScale().setVisibleRange({
        from: this.fullRangeStart,
        to: this.fullRangeEnd,
      })
      this.updateZoomState({
        from: this.fullRangeStart,
        to: this.fullRangeEnd,
      })
      return
    }
    const corrected = constrainVisibleRangeToBounds({
      currentFrom: from,
      currentTo: to,
      fullFrom: this.fullRangeStart,
      fullTo: this.fullRangeEnd,
      minRangeUnits: 1,
    })

    if (corrected.corrected) {
      this.chart.timeScale().setVisibleRange({
        from: corrected.from,
        to: corrected.to,
      })
      return
    }

    this.updateZoomState({ from, to })
  }

  private applyInitialRange(): void {
    if (!this.chart) {
      return
    }
    // Wrap in try-catch because setVisibleRange() and fitContent() can throw
    // if the chart's internal state isn't ready
    try {
      if (this.initialRangeStart != null && this.initialRangeEnd != null) {
        this.chart.timeScale().setVisibleRange({
          from: this.initialRangeStart,
          to: this.initialRangeEnd,
        })
        this.updateZoomState({
          from: this.initialRangeStart,
          to: this.initialRangeEnd,
        })
        return
      }
      this.chart.timeScale().fitContent()
      this.syncZoomStateFromChart()
    } catch {
      // Chart not ready yet - ignore the error
    }
  }

  private syncZoomStateFromChart(): void {
    if (!this.chart) {
      return
    }
    // Wrap in try-catch because getVisibleRange() can throw "Value is null" error
    // if the chart's internal state isn't ready (e.g., before data is fully processed)
    try {
      const currentRange = this.chart.timeScale().getVisibleRange()
      if (!currentRange) {
        return
      }
      this.updateZoomState({
        from: currentRange.from as number,
        to: currentRange.to as number,
      })
    } catch {
      // Chart not ready yet - ignore the error
    }
  }

  private updateZoomState(range: { from: number; to: number }): void {
    if (!this.fullRangeStart || !this.fullRangeEnd) {
      return
    }
    const isZoomed = getIsZoomed({
      currentFrom: range.from,
      currentTo: range.to,
      fullFrom: this.fullRangeStart,
      fullTo: this.fullRangeEnd,
    })
    this.latestZoomState = {
      visibleRange: { from: range.from, to: range.to },
      isZoomed,
    }
    this.callbacks.onZoomStateChange?.(this.latestZoomState)
  }

  private applyZoomFactor(factor: number): void {
    if (!this.chart || !this.fullRangeStart || !this.fullRangeEnd) {
      return
    }

    // Wrap in try-catch because getVisibleRange() and setVisibleRange() can throw
    // if the chart's internal state isn't ready
    try {
      const currentRange = this.chart.timeScale().getVisibleRange()
      const fallbackRange = this.latestZoomState.visibleRange
      const from = (currentRange?.from as number | undefined) ?? fallbackRange?.from ?? this.fullRangeStart
      const to = (currentRange?.to as number | undefined) ?? fallbackRange?.to ?? this.fullRangeEnd

      const nextRange = calculateZoomedRange({
        currentFrom: from,
        currentTo: to,
        fullFrom: this.fullRangeStart,
        fullTo: this.fullRangeEnd,
        zoomFactor: factor,
        minRange: 1,
      })

      this.chart.timeScale().setVisibleRange({
        from: Math.round(nextRange.from) as UTCTimestamp,
        to: Math.round(nextRange.to) as UTCTimestamp,
      })
      this.updateZoomState({ from: nextRange.from, to: nextRange.to })
    } catch {
      // Chart not ready yet - ignore the error
    }
  }

  private getPointCoordinates(point: ClearingPriceChartPoint): ChartCoordinates | null {
    const chart = this.chart
    const series = this.series
    if (!chart || !series) {
      return null
    }

    const xCoordinate = chart.timeScale().timeToCoordinate(point.time)
    const yCoordinate = series.priceToCoordinate(point.value)

    if (xCoordinate == null || yCoordinate == null) {
      return null
    }

    const chartPaneCanvas = this.container.querySelector<HTMLCanvasElement>(
      '.tv-lightweight-charts table tr:first-child td:nth-child(2) canvas',
    )

    if (!chartPaneCanvas) {
      const chartRoot = this.container.querySelector<HTMLElement>('.tv-lightweight-charts')
      const paddingTop = chartRoot ? Number.parseFloat(getComputedStyle(chartRoot).paddingTop) || 0 : 0

      return {
        x: Number(xCoordinate) + chart.priceScale('left').width(),
        y: Number(yCoordinate) + paddingTop,
      }
    }

    const containerRect = this.container.getBoundingClientRect()
    const paneRect = chartPaneCanvas.getBoundingClientRect()

    return {
      x: Number(xCoordinate) + (paneRect.left - containerRect.left),
      y: Number(yCoordinate) + (paneRect.top - containerRect.top),
    }
  }

  private updateHoverCoordinates(coordinates: ChartCoordinates | null): void {
    this.hoverCoordinates = coordinates
    this.callbacks.onHoverCoordinatesChange?.(coordinates)
  }

  public zoomIn(): void {
    if (!this.isZoomEnabled) {
      return
    }
    this.applyZoomFactor(ZOOM_FACTORS.ZOOM_IN)
  }

  public zoomOut(): void {
    if (!this.isZoomEnabled) {
      return
    }
    this.applyZoomFactor(ZOOM_FACTORS.ZOOM_OUT)
  }

  public resetToInitialRange(): void {
    if (!this.isZoomEnabled) {
      return
    }
    this.applyInitialRange()
  }
}
