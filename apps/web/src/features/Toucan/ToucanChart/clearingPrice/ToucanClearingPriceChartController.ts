/* oxlint-disable max-lines */
/* oxlint-disable typescript/no-unnecessary-condition -- fallback chains for optional range params */
import type { IChartApi, ISeriesApi, MouseEventParams, Time, UTCTimestamp } from 'lightweight-charts'
import { logger } from 'utilities/src/logger/logger'
import { formatTickMarks } from '~/components/Charts/utils'
import { CHART_DIMENSIONS, ZOOM_FACTORS } from '~/features/Toucan/Auction/BidDistributionChart/constants'
import { constrainVisibleRangeToBounds } from '~/features/Toucan/ToucanChart/bidDistribution/utils/visibleRange'
import {
  createAreaSeriesOptions,
  createTimeScaleOptions,
} from '~/features/Toucan/ToucanChart/clearingPrice/controller/chartOptions'
import { initClearingPriceChart } from '~/features/Toucan/ToucanChart/clearingPrice/controller/lifecycle/init'
import { handleClearingPriceCrosshairMove } from '~/features/Toucan/ToucanChart/clearingPrice/controller/logic/crosshairMove'
import type {
  ChartCoordinates,
  ClearingPriceChartControllerCreateParams,
  ClearingPriceChartControllerUpdateParams,
  ClearingPriceChartPoint,
  ClearingPriceZoomState,
  YAxisLabel,
} from '~/features/Toucan/ToucanChart/clearingPrice/types'
import { createYAxisPriceFormatter } from '~/features/Toucan/ToucanChart/clearingPrice/utils/priceFormatter'
import { calculateYAxisTicks } from '~/features/Toucan/ToucanChart/clearingPrice/utils/yAxisRange'
import { calculateZoomedRange, getIsZoomed } from '~/features/Toucan/ToucanChart/utils/zoomRange'

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
  private preBidSeries: ISeriesApi<'Area'> | null = null
  private container: HTMLDivElement
  private teardownFn: (() => void) | null = null
  private subscribeVisibleRangeChangesFn: (() => void) | null = null
  private hasSubscribedVisibleRangeChanges = false
  private latestData: ClearingPriceChartControllerUpdateParams['data'] = []
  /** Whether to use logical range positioning (75% visible data width) */
  private useLogicalRangePositioning = false
  /** Whether the visible range snaps to the data edges in logical units (LP-806 no-bids full-width line) */
  private snapVisibleRangeToDataEdges = false
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
  private latestPreBidEndTime: UTCTimestamp | undefined
  private latestScaleFactor = 1
  private latestMaxFractionDigits = 4
  private latestScaledYMin = 0
  private latestScaledYMax = 0

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
      disableMouseWheelInteractions = false,
      snapVisibleRangeToDataEdges = false,
      solidAreaFill = false,
      preBidEndTime,
    } = params

    this.latestPreBidEndTime = preBidEndTime

    // Store positioning mode for coordinate calculations and resize handling
    this.useLogicalRangePositioning = useLogicalRangePositioning ?? false
    this.snapVisibleRangeToDataEdges = snapVisibleRangeToDataEdges
    this.isZoomEnabled = isZoomEnabled

    const resolvedStart = fullRangeStart ?? visibleRangeStart ?? data[0]?.time ?? null
    const resolvedEnd = fullRangeEnd ?? visibleRangeEnd ?? data[data.length - 1]?.time ?? null
    this.initialRangeStart = initialRangeStart ?? visibleRangeStart ?? resolvedStart
    this.initialRangeEnd = initialRangeEnd ?? visibleRangeEnd ?? resolvedEnd
    this.fullRangeStart = this.initialRangeStart ?? resolvedStart
    this.fullRangeEnd = this.initialRangeEnd ?? resolvedEnd

    const interactionOptions = buildInteractionOptions({ isZoomEnabled, disableMouseWheelInteractions })

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

    // Set data and series options. If a pre-bid phase is defined, split the data so the
    // pre-bid portion renders as a dashed line (no area fill) and the clearing portion
    // renders as the usual area series. The boundary point is included in both slices
    // so the two segments visually connect.
    this.latestData = data
    applyPreBidSplitData({ data, preBidEndTime, series, preBidSeries: this.preBidSeries })

    // Subscribe to visible range changes AFTER first setData to avoid lightweight-charts
    // internal errors when range change events fire before data is loaded.
    if (!this.hasSubscribedVisibleRangeChanges && this.subscribeVisibleRangeChangesFn) {
      this.subscribeVisibleRangeChangesFn()
      this.hasSubscribedVisibleRangeChanges = true
    }

    const resolvedTokenColor = tokenColor ?? this.createParams.tokenColor
    const seriesOptions = createAreaSeriesOptions({
      colors: this.createParams.colors,
      tokenColor: resolvedTokenColor,
      scaledYMin,
      scaledYMax,
      solidAreaFill,
    })
    series.applyOptions(seriesOptions)
    this.preBidSeries?.applyOptions(seriesOptions)

    applyVisibleRange({
      chart,
      data,
      useLogicalRangePositioning,
      snapVisibleRangeToDataEdges,
      visibleRangeStart,
      visibleRangeEnd,
    })

    this.latestScaleFactor = scaleFactor
    this.latestMaxFractionDigits = maxFractionDigits
    this.latestScaledYMin = scaledYMin
    this.latestScaledYMax = scaledYMax

    this.syncZoomStateFromChart()
    this.emitYAxisLabels()
    this.emitVisiblePriceRange()
  }

  private emitYAxisLabels(): void {
    const series = this.series
    if (!series || this.latestData.length === 0) {
      this.callbacks.onYAxisLabelsChange?.([])
      return
    }

    const chartHeight = this.createParams.height
    const formatter = createYAxisPriceFormatter({
      scaleFactor: this.latestScaleFactor,
      maxFractionDigits: this.latestMaxFractionDigits,
    })

    // Use the full Y range (includes distribution tick extension) for label generation
    const ticks = calculateYAxisTicks({
      min: this.latestScaledYMin,
      max: this.latestScaledYMax,
      formatter,
    })

    const labels: YAxisLabel[] = []
    let lastY: number | null = null
    for (const tick of ticks) {
      const y = series.priceToCoordinate(tick.value)
      if (y != null && y >= 0 && y <= chartHeight) {
        const yNum = Number(y)
        if (lastY !== null && Math.abs(yNum - lastY) < CHART_DIMENSIONS.Y_AXIS_MIN_WIDTH) {
          continue
        }
        labels.push({ label: tick.label, y: yNum })
        lastY = yNum
      }
    }

    this.callbacks.onYAxisLabelsChange?.(labels)
  }

  /**
   * Emit the visible price range by sampling the top and bottom of the chart area.
   * Uses series.coordinateToPrice() to get exact price values at pixel boundaries.
   */
  private emitVisiblePriceRange(): void {
    const series = this.series
    if (!series || this.latestData.length === 0) {
      return
    }

    try {
      const chartHeight = this.createParams.height
      const topPrice = series.coordinateToPrice(0)
      const bottomPrice = series.coordinateToPrice(chartHeight)

      if (topPrice == null || bottomPrice == null || !Number.isFinite(topPrice) || !Number.isFinite(bottomPrice)) {
        return
      }

      // topPrice is the max (top of chart), bottomPrice is the min (bottom of chart)
      const min = Math.min(topPrice, bottomPrice)
      const max = Math.max(topPrice, bottomPrice)

      this.callbacks.onVisiblePriceRangeChange?.({ min, max })
    } catch {
      // Chart not ready yet
    }
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
      this.preBidSeries = result.preBidSeries
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
    this.preBidSeries = null
  }

  private onResize(): void {
    if (!this.chart) {
      return
    }

    this.chart.applyOptions({
      width: this.container.clientWidth,
      height: this.createParams.height,
    })
    if (!this.snapVisibleRangeToDataEdges && this.latestZoomState.visibleRange) {
      this.chart.timeScale().setVisibleRange(
        this.latestZoomState.visibleRange as {
          from: UTCTimestamp
          to: UTCTimestamp
        },
      )
      this.emitYAxisLabels()
      this.emitVisiblePriceRange()
      return
    }
    this.applyInitialRange()
    this.emitYAxisLabels()
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
      preBidSeries: this.preBidSeries,
      preBidEndTime: this.latestPreBidEndTime,
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
    this.emitYAxisLabels()
    this.emitVisiblePriceRange()
  }

  private applyInitialRange(): void {
    if (!this.chart) {
      return
    }
    // Wrap in try-catch because setVisibleRange() and fitContent() can throw
    // if the chart's internal state isn't ready
    try {
      if (this.snapVisibleRangeToDataEdges && this.latestData.length > 2) {
        this.chart.timeScale().setVisibleLogicalRange({ from: 0.5, to: this.latestData.length - 1.5 })
        this.syncZoomStateFromChart()
        return
      }
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

function buildInteractionOptions({
  isZoomEnabled,
  disableMouseWheelInteractions,
}: {
  isZoomEnabled: boolean
  disableMouseWheelInteractions: boolean
}): {
  handleScroll: { mouseWheel: boolean; pressedMouseMove: boolean; horzTouchDrag: boolean; vertTouchDrag: boolean }
  handleScale: {
    mouseWheel: boolean
    pinch: boolean
    axisPressedMouseMove: { time: boolean; price: boolean }
  }
} {
  if (!isZoomEnabled) {
    return {
      handleScroll: { mouseWheel: false, pressedMouseMove: false, horzTouchDrag: false, vertTouchDrag: false },
      handleScale: {
        mouseWheel: false,
        pinch: false,
        axisPressedMouseMove: { time: false, price: false },
      },
    }
  }
  return {
    handleScroll: {
      mouseWheel: !disableMouseWheelInteractions,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      mouseWheel: !disableMouseWheelInteractions,
      pinch: true,
      axisPressedMouseMove: { time: true, price: false },
    },
  }
}

function applyPreBidSplitData({
  data,
  preBidEndTime,
  series,
  preBidSeries,
}: {
  data: ClearingPriceChartPoint[]
  preBidEndTime: UTCTimestamp | undefined
  series: ISeriesApi<'Area'>
  preBidSeries: ISeriesApi<'Area'> | null
}): void {
  if (preBidEndTime === undefined || data.length === 0) {
    preBidSeries?.setData([])
    series.setData(data)
    return
  }
  const boundary = preBidEndTime as number
  const splitIdx = data.findIndex((p) => (p.time as number) >= boundary)
  if (splitIdx === -1) {
    // All points are pre-bid — keep area series alive with the last point to preserve Y-axis labels
    preBidSeries?.setData(data)
    series.setData([data[data.length - 1]!])
  } else if (splitIdx === 0) {
    preBidSeries?.setData([])
    series.setData(data)
  } else {
    preBidSeries?.setData(data.slice(0, splitIdx + 1))
    series.setData(data.slice(splitIdx))
  }
}

function applyVisibleRange({
  chart,
  data,
  useLogicalRangePositioning,
  snapVisibleRangeToDataEdges,
  visibleRangeStart,
  visibleRangeEnd,
}: {
  chart: IChartApi
  data: ClearingPriceChartPoint[]
  useLogicalRangePositioning: boolean | undefined
  snapVisibleRangeToDataEdges?: boolean
  visibleRangeStart: UTCTimestamp | undefined
  visibleRangeEnd: UTCTimestamp | undefined
}): void {
  // Range operations can throw if chart's internal state isn't ready
  try {
    if (useLogicalRangePositioning && data.length > 0) {
      const logicalEnd = Math.ceil(data.length / 0.75)
      chart.timeScale().setVisibleLogicalRange({ from: 0, to: logicalEnd })
    } else if (snapVisibleRangeToDataEdges && data.length > 2) {
      // Half-bar offsets pin the first/last point centers exactly onto the chart edges —
      // whole-index ranges leave half-bar margins on both sides (LP-806)
      chart.timeScale().setVisibleLogicalRange({ from: 0.5, to: data.length - 1.5 })
    } else if (visibleRangeStart !== undefined && visibleRangeEnd !== undefined) {
      chart.timeScale().setVisibleRange({ from: visibleRangeStart, to: visibleRangeEnd })
    } else {
      chart.timeScale().fitContent()
    }
  } catch {
    // Chart not ready yet
  }
}
