/* eslint-disable max-lines -- TODO(Toucan): keep controller small; current file is an orchestration hub */

import { IChartApi, ISeriesApi, MouseEventParams, Time, UTCTimestamp } from 'lightweight-charts'
import { opacify } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { initToucanBidDistributionChart } from '~/components/Charts/ToucanChart/bidDistribution/controller/lifecycle/init'
import { computeBidLineTooltipState } from '~/components/Charts/ToucanChart/bidDistribution/controller/logic/bidLineTooltip'
import { getSelectedTickPriceFromChartClick } from '~/components/Charts/ToucanChart/bidDistribution/controller/logic/chartClick'
import { computeClearingPriceTooltipState } from '~/components/Charts/ToucanChart/bidDistribution/controller/logic/clearingPriceTooltip'
import { handleToucanCrosshairMove } from '~/components/Charts/ToucanChart/bidDistribution/controller/logic/crosshairMove'
import { recenterRangeOnBid } from '~/components/Charts/ToucanChart/bidDistribution/controller/logic/outOfRangeRecenter'
import {
  canExtendChartToBid,
  updateBidDistributionOverlays,
} from '~/components/Charts/ToucanChart/bidDistribution/controller/logic/overlays'
import {
  applyZoomFromState,
  captureZoomState,
} from '~/components/Charts/ToucanChart/bidDistribution/controller/logic/zoom'
import type {
  ToucanBidDistributionChartControllerCreateParams,
  ToucanBidDistributionChartControllerRefs,
  ToucanBidDistributionChartControllerUpdateParams,
  ToucanBidDistributionChartZoomState,
} from '~/components/Charts/ToucanChart/bidDistribution/types'
import { constrainVisibleRangeToBounds } from '~/components/Charts/ToucanChart/bidDistribution/utils/visibleRange'
import type { ToucanChartSeriesOptions } from '~/components/Charts/ToucanChart/renderer'
import type { ToucanChartSeries } from '~/components/Charts/ToucanChart/toucan-chart-series'
import { createConcentrationGradientColors, getChartBarColors } from '~/components/Charts/ToucanChart/utils/colors'
import { getNiceStepForMaxLabels, getPrecisionForMinMove } from '~/components/Charts/ToucanChart/utils/yAxisLabels'
import { calculateZoomedRange } from '~/components/Charts/ToucanChart/utils/zoomRange'
import {
  BID_LINE,
  CHART_CONSTRAINTS,
  CHART_FONT_FAMILY,
  CLEARING_PRICE_LINE,
  TOLERANCE,
  ZOOM_FACTORS,
} from '~/components/Toucan/Auction/BidDistributionChart/constants'
/**
 * Responsibilities:
 * - Own lightweight-charts lifecycle (create/remove + subscriptions)
 * - Own DOM overlays (labels layer, clearing price label/arrow, bid dot, bid out-of-range indicator)
 * - Emit domain events to the React layer (selected tick, zoom state, tooltip states)
 *
 * Implementation style:
 * - Controller is intentionally "thin orchestration"; logic lives in `controller/*` modules.
 */

export class ToucanBidDistributionChartController {
  private static readonly MAX_Y_LABELS = 12
  private readonly createParams: ToucanBidDistributionChartControllerCreateParams
  private readonly callbacks: ToucanBidDistributionChartControllerCreateParams['callbacks']

  private chart: IChartApi | null = null
  private series: ISeriesApi<'Custom'> | null = null
  private toucanChartSeries: ToucanChartSeries | null = null

  private container: HTMLDivElement

  private labelsLayer: HTMLDivElement | null = null
  private clearingPriceArrow: HTMLDivElement | null = null
  private bidLineDot: HTMLDivElement | null = null
  private bidOutOfRangeIndicator: HTMLDivElement | null = null
  private hoverRafId: number | null = null
  private overlayUpdateRafId: number | null = null
  private pendingHoverState: {
    hoveredTickValue: number | null
    isHoveringClearingPrice: boolean
  } | null = null
  private lastAppliedHoverState: {
    hoveredTickValue: number | null
    isHoveringClearingPrice: boolean
  } | null = null
  private teardownFn: (() => void) | null = null
  private boundDocumentMouseMove: ((e: MouseEvent) => void) | null = null
  private isTrackingMouseLeave = false
  private hoverResetCooldownUntil = 0
  private subscribeVisibleRangeChangesFn: (() => void) | null = null
  private unsubscribeVisibleRangeChangesFn: (() => void) | null = null
  private hasSubscribedVisibleRangeChanges = false
  private hoverResetTimeoutId: number | null = null

  private minTime: UTCTimestamp | null = null
  private maxTime: UTCTimestamp | null = null

  private lastZoomState: ToucanBidDistributionChartZoomState | null = null
  private lastUpdateParams: ToucanBidDistributionChartControllerUpdateParams | null = null
  private hasInitializedRange = false
  constructor(params: ToucanBidDistributionChartControllerCreateParams) {
    this.createParams = params
    this.callbacks = params.callbacks
    this.container = params.container
    this.init()
  }

  public getRefs(): ToucanBidDistributionChartControllerRefs {
    return {
      chart: this.chart,
      series: this.series,
      minTime: this.minTime,
      maxTime: this.maxTime,
    }
  }

  public destroy(): void {
    try {
      if (this.hoverRafId != null) {
        cancelAnimationFrame(this.hoverRafId)
        this.hoverRafId = null
      }
      if (this.overlayUpdateRafId != null) {
        cancelAnimationFrame(this.overlayUpdateRafId)
        this.overlayUpdateRafId = null
      }
      if (this.hoverResetTimeoutId != null) {
        clearTimeout(this.hoverResetTimeoutId)
        this.hoverResetTimeoutId = null
      }
      this.stopTrackingMouseLeave()
      this.teardown()
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'ToucanBidDistributionChartController',
          function: 'destroy',
        },
      })
    }
  }

  public resetHoverState(): void {
    this.stopTrackingMouseLeave()
    // Set a cooldown to ignore crosshair events for a short period.
    // This prevents lightweight-charts from immediately re-triggering hover
    // when we call setData() to force a redraw.
    this.hoverResetCooldownUntil = Date.now() + 100
    this.scheduleSeriesHoverState({
      hoveredTickValue: null,
      isHoveringClearingPrice: false,
    })
    // Also hide the tooltip immediately via React state
    this.callbacks.onChartBarTooltipStateChange({
      left: 0,
      top: 0,
      isVisible: false,
      tickValue: 0,
      volumeAmount: 0,
      totalVolume: 0,
    })
    // Call React-level callback to handle hover reset (e.g., toggle group ticks for debugging)
    this.callbacks.onResetHoverState?.()
  }

  /**
   * Starts tracking mouse position at the document level to detect when mouse leaves the chart.
   * This is more reliable than mouseleave events which can be blocked by child elements.
   */
  private startTrackingMouseLeave(): void {
    if (this.isTrackingMouseLeave) {
      return
    }
    this.isTrackingMouseLeave = true

    // Track the last known container rect to enable early exit optimization
    let cachedRect: DOMRect | null = null
    let lastRectUpdate = 0
    const RECT_CACHE_MS = 100 // Refresh rect every 100ms max

    this.boundDocumentMouseMove = (e: MouseEvent) => {
      // Refresh cached rect periodically (avoids calling getBoundingClientRect on every move)
      const now = Date.now()
      if (!cachedRect || now - lastRectUpdate > RECT_CACHE_MS) {
        cachedRect = this.container.getBoundingClientRect()
        lastRectUpdate = now
      }

      // Early exit: if mouse is clearly outside the chart with buffer, skip expensive checks
      const buffer = 50
      if (
        e.clientX < cachedRect.left - buffer ||
        e.clientX > cachedRect.right + buffer ||
        e.clientY < cachedRect.top - buffer ||
        e.clientY > cachedRect.bottom + buffer
      ) {
        this.resetHoverState()
        return
      }

      // For positions near the boundary, get fresh rect for accurate detection
      const rect = this.container.getBoundingClientRect()
      cachedRect = rect
      lastRectUpdate = now

      const isInsideChart =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom

      if (!isInsideChart) {
        this.resetHoverState()
      }
    }

    document.addEventListener('mousemove', this.boundDocumentMouseMove)
  }

  private stopTrackingMouseLeave(): void {
    if (!this.isTrackingMouseLeave || !this.boundDocumentMouseMove) {
      return
    }
    document.removeEventListener('mousemove', this.boundDocumentMouseMove)
    this.boundDocumentMouseMove = null
    this.isTrackingMouseLeave = false
  }

  public resetToInitialZoom(): void {
    const chart = this.chart
    const next = this.lastUpdateParams
    if (!chart || !next || this.minTime === null || this.maxTime === null) {
      return
    }

    try {
      this.hasInitializedRange = false

      // Apply the implicit initial range (as defined by zoomConfig.ts) regardless of prior interactions.
      const result = applyZoomFromState({
        chart,
        hasInitializedRange: false,
        chartZoomState: { visibleRange: null, isZoomed: false },
        concentration: next.concentration,
        clearingPriceDecimal: next.clearingPriceDecimal,
        minTick: next.minTick,
        maxTick: next.maxTick,
        tickSizeDecimal: next.tickSizeDecimal,
        priceScaleFactor: next.priceScaleFactor,
        chartMode: this.createParams.chartMode,
      })
      this.hasInitializedRange = result.hasInitializedRange

      // Clear lastZoomState so the store is updated even if it happens to match.
      this.lastZoomState = null

      // Refresh overlays + derived state that depends on geometry/visible range.
      this.callbacks.onRequestMarkerPositionsUpdate()
      this.updateOverlays(next)
      this.updateBidLineTooltipState(next)
      this.captureZoomStateToStore(next)
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'ToucanBidDistributionChartController',
          function: 'resetToInitialZoom',
        },
      })
    }
  }

  public zoomIn(): void {
    this.applyZoomFactor(ZOOM_FACTORS.ZOOM_IN)
  }

  public zoomOut(): void {
    this.applyZoomFactor(ZOOM_FACTORS.ZOOM_OUT)
  }

  public update(next: ToucanBidDistributionChartControllerUpdateParams): void {
    this.lastUpdateParams = next

    const chart = this.chart
    const series = this.series
    if (!chart || !series) {
      return
    }

    // Lock/unlock scaling (zooming) without affecting panning.
    chart.applyOptions({
      handleScale: {
        mouseWheel: next.isZoomEnabled,
        pinch: next.isZoomEnabled,
        axisPressedMouseMove: {
          time: next.isZoomEnabled,
          price: false,
        },
      },
    })

    // If hover state should be reset, set the force reset flag on the renderer.
    // We can't rely on series.applyOptions() because lightweight-charts caches options internally
    // and doesn't use the updated values when setData() triggers the renderer.
    // Instead, we set a flag that tells the renderer to ignore the cached hoveredTickValue.
    if (next.shouldResetHoverState && this.toucanChartSeries) {
      this.toucanChartSeries._renderer._forceHoverReset = true
      // Also reset the internal tracking state
      this.lastAppliedHoverState = {
        hoveredTickValue: null,
        isHoveringClearingPrice: false,
      }
      // Clear the flag after the cooldown period to allow normal hover behavior to resume
      // The cooldown prevents lightweight-charts crosshair events from re-triggering hover
      const renderer = this.toucanChartSeries._renderer
      // Clear any existing timeout to avoid race conditions
      if (this.hoverResetTimeoutId != null) {
        clearTimeout(this.hoverResetTimeoutId)
      }
      this.hoverResetTimeoutId = window.setTimeout(() => {
        this.hoverResetTimeoutId = null
        renderer._forceHoverReset = false
      }, 150) // Slightly longer than hoverResetCooldownUntil (100ms)
    }

    // Set bid line hide flag directly on the renderer to bypass lightweight-charts options caching.
    // When userBidPriceDecimal is null (e.g., user switched away from "Place a bid" tab),
    // we force the bid line to hide immediately instead of waiting for cached options to update.
    if (this.toucanChartSeries) {
      this.toucanChartSeries._renderer._forceBidLineHide = next.userBidPriceDecimal == null
    }

    // Base series styling/options (event-driven redraw: apply options on updates)
    // IMPORTANT: Apply options BEFORE setData so the renderer has updated values (e.g., userBidPrice)
    // when the canvas redraws. Without this ordering, the old cached options would be used.
    // Color scheme per Figma design:
    // - clearingPriceColor: Pure token color (for bars at clearing price tick)
    // - concentrationColor: Token + white overlay (for bars in concentration band, hovered bars)
    // - aboveClearingPriceColor: Pure token color (for bars above concentration range)
    // - belowClearingPriceColor: neutral3 (for bars below clearing price)
    const barColors = getChartBarColors({
      tokenColor: this.createParams.tokenColor,
      fallbackAccentColor: this.createParams.colors.accent1.val,
      neutralColor: this.createParams.colors.neutral3.val,
    })

    const labelColors = {
      background: this.createParams.colors.surface2.val,
      border: this.createParams.colors.surface3.val,
      text: this.createParams.colors.neutral1.val,
      subtitle: this.createParams.colors.neutral3.val,
    }

    const labelStyles = { fontFamily: CHART_FONT_FAMILY }

    const clearingPriceLineColors = {
      gradientStart: opacify(CLEARING_PRICE_LINE.GRADIENT_START_OPACITY * 100, this.createParams.colors.neutral1.val),
      gradientEnd: opacify(CLEARING_PRICE_LINE.GRADIENT_END_OPACITY * 100, this.createParams.colors.neutral1.val),
    }

    const bidLineColors = {
      gradientStart: opacify(BID_LINE.GRADIENT_START_OPACITY * 100, this.createParams.colors.neutral1.val),
      gradientEnd: opacify(BID_LINE.GRADIENT_END_OPACITY * 100, this.createParams.colors.neutral1.val),
      dotFill: this.createParams.colors.surface1.val,
      dotBorder: this.createParams.colors.neutral1.val,
      stripeColor: this.createParams.colors.neutral1.val,
    }

    let maxHistogramValue = 0
    for (const point of next.histogramData) {
      if (Number.isFinite(point.value) && point.value > maxHistogramValue) {
        maxHistogramValue = point.value
      }
    }

    const yAxisMinMove = getNiceStepForMaxLabels({
      minValue: 0,
      maxValue: maxHistogramValue,
      maxLabels: ToucanBidDistributionChartController.MAX_Y_LABELS,
    })
    const yAxisPrecision = getPrecisionForMinMove(yAxisMinMove)

    // Generate dynamic gradient colors based on token color
    // barColors.clearingPriceColor is the effective token color (token color or fallback accent)
    const concentrationGradientColors = createConcentrationGradientColors(barColors.clearingPriceColor)

    // IMPORTANT: lightweight-charts deep-merges options. Keep `concentrationBand` as an object always; using
    // `null` can crash later when the library tries to merge an object into it (`startIndex` on null).
    const concentrationBand =
      next.concentration != null
        ? {
            startIndex: next.concentration.startIndex,
            endIndex: next.concentration.endIndex,
            startTick: next.concentration.startTick,
            endTick: next.concentration.endTick,
          }
        : {
            startIndex: 0,
            endIndex: 0,
            startTick: Number.NaN,
            endTick: Number.NaN,
          }

    const baseOptions: Partial<ToucanChartSeriesOptions> = {
      barColors,
      labelColors,
      labelStyles,
      clearingPriceLineColors,
      bidLineColors,
      concentrationGradientColors,
      clearingPrice: next.clearingPriceDecimal,
      tickSize: next.tickSizeDecimal,
      priceScaleFactor: next.priceScaleFactor,
      concentrationBand,
      userBidPrice: next.userBidPriceDecimal,
      priceFormat: { type: 'price', minMove: yAxisMinMove, precision: yAxisPrecision },
    }

    series.applyOptions({
      ...(baseOptions as ToucanChartSeriesOptions),
      ...(next.seriesOptionsPatch ?? {}),
    })

    // Data + min/max time tracking
    // Before setting data, check if current visible range extends beyond new data bounds.
    // If so, we need to reset the chart state to avoid a lightweight-charts crash.
    // The crash happens because setData() fires an internal _onVisibleBarsChanged callback
    // that tries to compute the visible range, but fails when the range references non-existent data.
    let needsRangeReset = false
    if (next.histogramData.length > 0) {
      const newMinTime = next.histogramData[0].time as number
      const newMaxTime = next.histogramData[next.histogramData.length - 1].time as number
      try {
        const currentRange = chart.timeScale().getVisibleRange()
        if (currentRange) {
          const currentFrom = currentRange.from as number
          const currentTo = currentRange.to as number
          // If visible range extends beyond new data bounds, we need to reset
          if (currentTo > newMaxTime || currentFrom < newMinTime) {
            needsRangeReset = true
          }
        }
      } catch {
        // If we can't check, try to reset anyway
        needsRangeReset = true
      }
    }

    // Temporarily unsubscribe visible range change listeners before setData() to prevent a
    // lightweight-charts internal crash. During setData(), the internal _onVisibleBarsChanged
    // handler calls getVisibleRange() → _timeRangeForLogicalRange(), which throws "Value is null"
    // when the logical range can't be mapped to valid time values during the data transition.
    // By removing our listeners, _timeRangeChanged.hasListeners() returns false and
    // getVisibleRange() is never called.
    //
    // This must happen unconditionally (not just when needsRangeReset is true) because the crash
    // can occur whenever the set of time values changes — e.g., switching between grouped/ungrouped
    // ticks changes the time points even when the visible range is within the new data bounds.
    const didUnsubscribe = this.hasSubscribedVisibleRangeChanges
    if (didUnsubscribe) {
      this.unsubscribeVisibleRangeChangesFn?.()
    }

    try {
      if (needsRangeReset) {
        // Clear data first to reset chart's internal state, then fitContent to reset visible range
        series.setData([])
        chart.timeScale().fitContent()
      }

      series.setData(next.histogramData)
    } finally {
      // Always resubscribe to maintain consistent listener state
      if (didUnsubscribe) {
        this.subscribeVisibleRangeChangesFn?.()
      }
    }

    // After setData, if we reset the range, mark that we need to re-initialize
    if (needsRangeReset) {
      this.hasInitializedRange = false
    }
    if (next.histogramData.length > 0) {
      this.minTime = next.histogramData[0].time
      this.maxTime = next.histogramData[next.histogramData.length - 1].time
    } else {
      this.minTime = null
      this.maxTime = null
    }

    this.restoreHoverState(next)

    // Subscribe to visible range changes AFTER first setData to avoid lightweight-charts
    // internal errors when range change events fire before data is loaded.
    if (!this.hasSubscribedVisibleRangeChanges && this.subscribeVisibleRangeChangesFn) {
      this.subscribeVisibleRangeChangesFn()
      this.hasSubscribedVisibleRangeChanges = true
    }

    // When forceInitialZoom is set (e.g., switching to grouped mode), reset hasInitializedRange
    // so applyZoomFromState enters the first-initialization path (fitContent + setVisibleRange).
    // This matches the behavior of resetToInitialZoom().
    if (next.forceInitialZoom) {
      this.hasInitializedRange = false
    }

    // Apply zoom state from store (keeps persistence semantics)
    this.applyZoomFromState(next.chartZoomState, next)

    // Update overlays (labels, clearing price label/arrow, bid dot, out-of-range indicator)
    this.updateOverlays(next)

    // Schedule a second overlay update after the renderer has drawn.
    // The renderer's draw() is called asynchronously after setData(), so on the first update
    // the cached clearing price position isn't available yet. This ensures proper alignment
    // of DOM overlays (like the clearing price arrow) with canvas-rendered elements.
    this.overlayUpdateRafId = requestAnimationFrame(() => {
      this.overlayUpdateRafId = null
      if (this.chart && this.lastUpdateParams) {
        this.updateOverlays(this.lastUpdateParams)
        // Markers are React overlays; refresh them after chart draw to avoid transient positions.
        this.callbacks.onRequestMarkerPositionsUpdate()
      }
    })
    this.updateBidLineTooltipState(next)
  }

  private restoreHoverState(next: ToucanBidDistributionChartControllerUpdateParams): void {
    if (!this.series || next.shouldResetHoverState || !this.lastAppliedHoverState) {
      return
    }

    const { hoveredTickValue, isHoveringClearingPrice } = this.lastAppliedHoverState
    const canRestoreTick = hoveredTickValue != null && this.isHoveredTickPresent({ hoveredTickValue, next })

    if (!canRestoreTick && !isHoveringClearingPrice) {
      return
    }

    const nextHoverState = {
      hoveredTickValue: canRestoreTick ? hoveredTickValue : null,
      isHoveringClearingPrice,
    }

    this.lastAppliedHoverState = nextHoverState
    this.series.applyOptions(nextHoverState as Partial<ToucanChartSeriesOptions>)
  }

  private isHoveredTickPresent(params: {
    hoveredTickValue: number
    next: ToucanBidDistributionChartControllerUpdateParams
  }): boolean {
    const { hoveredTickValue, next } = params
    const tickSize = next.tickSizeDecimal
    const tolerance =
      Number.isFinite(tickSize) && tickSize > 0 ? tickSize * TOLERANCE.TICK_MATCHING : TOLERANCE.FALLBACK

    return next.barsForMarkers.some((bar) => Math.abs(bar.tick - hoveredTickValue) <= tolerance)
  }

  private init(): void {
    try {
      const onCrosshairMove = (param: MouseEventParams<Time>) => this.onCrosshairMove(param)
      const onClick = (param: MouseEventParams<Time>) => this.onChartClick(param)
      const onVisibleRangeChange = () => this.onVisibleRangeChange()
      const onResize = () => this.onResize()
      const onBidOutOfRangeIndicatorClick = () => this.onBidOutOfRangeIndicatorClick()

      const result = initToucanBidDistributionChart({
        createParams: this.createParams,
        container: this.container,
        onCrosshairMove,
        onClick,
        onVisibleRangeChange,
        onResize,
        onBidOutOfRangeIndicatorClick,
      })

      this.chart = result.chart
      this.series = result.series
      this.toucanChartSeries = result.toucanChartSeries
      this.labelsLayer = result.elements.labelsLayer
      this.clearingPriceArrow = result.elements.clearingPriceArrow
      this.bidLineDot = result.elements.bidLineDot
      this.bidOutOfRangeIndicator = result.elements.bidOutOfRangeIndicator
      this.teardownFn = result.teardown
      this.subscribeVisibleRangeChangesFn = result.subscribeVisibleRangeChanges
      this.unsubscribeVisibleRangeChangesFn = result.unsubscribeVisibleRangeChanges
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'ToucanBidDistributionChartController',
          function: 'init',
        },
      })
      return
    }

    // Initial overlay render on next frame.
    requestAnimationFrame(() => {
      this.callbacks.onRequestMarkerPositionsUpdate()
    })
  }

  private teardown(): void {
    const chart = this.chart
    if (!chart) {
      return
    }

    // Unsubscribe listeners
    this.teardownFn?.()
    this.teardownFn = null

    this.labelsLayer = null
    this.clearingPriceArrow = null
    this.bidLineDot = null
    this.bidOutOfRangeIndicator = null

    chart.remove()
    this.chart = null
    this.series = null
    this.toucanChartSeries = null
    this.minTime = null
    this.maxTime = null
  }

  private onResize(): void {
    if (!this.chart) {
      return
    }

    this.chart.applyOptions({
      width: this.container.clientWidth,
      height: this.createParams.height,
    })
    this.callbacks.onRequestMarkerPositionsUpdate()

    if (this.lastUpdateParams) {
      this.updateOverlays(this.lastUpdateParams)
      this.updateBidLineTooltipState(this.lastUpdateParams)
    }
  }

  private onVisibleRangeChange(): void {
    this.callbacks.onRequestMarkerPositionsUpdate()

    if (this.lastUpdateParams) {
      const corrected = this.constrainVisibleRangeToData(this.lastUpdateParams)
      if (!corrected) {
        this.captureZoomStateToStore(this.lastUpdateParams)
      }
      this.updateOverlays(this.lastUpdateParams)
      this.updateBidLineTooltipState(this.lastUpdateParams)
    }
  }

  private onCrosshairMove(param: MouseEventParams<Time>): void {
    const chart = this.chart
    const series = this.series
    const next = this.lastUpdateParams
    if (!chart || !series || !next) {
      return
    }
    handleToucanCrosshairMove({
      param,
      chart,
      series,
      containerWidth: this.container.clientWidth,
      containerHeight: this.container.clientHeight,
      priceScaleFactor: next.priceScaleFactor,
      clearingPriceDecimal: next.clearingPriceDecimal,
      totalBidVolume: next.totalBidVolume,
      setSeriesHoverState: (state) => this.scheduleSeriesHoverState(state),
      onChartBarTooltipStateChange: this.callbacks.onChartBarTooltipStateChange,
      onRequestOverlayUpdate: () => this.updateOverlays(next),
    })
  }

  private scheduleSeriesHoverState(state: { hoveredTickValue: number | null; isHoveringClearingPrice: boolean }): void {
    // If we're in a cooldown period after a reset, ignore new hover events (unless it's a reset).
    // This prevents lightweight-charts from immediately re-triggering hover when we call setData().
    const isResetEvent = state.hoveredTickValue === null && !state.isHoveringClearingPrice
    if (!isResetEvent && Date.now() < this.hoverResetCooldownUntil) {
      return
    }

    this.pendingHoverState = state

    // Start tracking mouse leave when we have an active hover, stop when hover is cleared
    if (state.hoveredTickValue !== null || state.isHoveringClearingPrice) {
      this.startTrackingMouseLeave()
      // If user is hovering again after a reset, cancel pending timeout and clear the force reset flag
      if (this.toucanChartSeries?._renderer._forceHoverReset) {
        if (this.hoverResetTimeoutId != null) {
          clearTimeout(this.hoverResetTimeoutId)
          this.hoverResetTimeoutId = null
        }
        this.toucanChartSeries._renderer._forceHoverReset = false
      }
    }

    if (this.hoverRafId != null) {
      return
    }
    this.hoverRafId = requestAnimationFrame(() => {
      this.hoverRafId = null
      const series = this.series
      const pending = this.pendingHoverState
      if (!series || !pending) {
        return
      }
      const last = this.lastAppliedHoverState
      if (
        last &&
        last.hoveredTickValue === pending.hoveredTickValue &&
        last.isHoveringClearingPrice === pending.isHoveringClearingPrice
      ) {
        return
      }
      this.lastAppliedHoverState = pending

      // Apply hover state via the official API.
      // Note: For reset events triggered by mouse leave, the React layer will also increment
      // chartHoverResetKey which forces a new histogramData reference, triggering controller.update()
      // with fresh data. This ensures lightweight-charts' internal cached options are reset.
      series.applyOptions(pending as Partial<ToucanChartSeriesOptions>)

      // Update the clearing price tooltip state when hover state changes.
      // This ensures the tooltip hides when moving away from the clearing price line.
      if (this.lastUpdateParams) {
        this.updateClearingPriceTooltipState(this.lastUpdateParams)
      }
    })
  }

  private onChartClick(param: MouseEventParams<Time>): void {
    const next = this.lastUpdateParams
    const chart = this.chart
    const series = this.series
    if (!next || !chart || !series) {
      return
    }

    try {
      const selectedTick = getSelectedTickPriceFromChartClick({
        param,
        chart,
        series,
        priceScaleFactor: next.priceScaleFactor,
        bidTokenInfo: next.bidTokenInfo,
        auctionTokenDecimals: next.auctionTokenDecimals,
        floorPriceQ96: next.floorPriceQ96,
        clearingPriceQ96: next.clearingPriceQ96,
        tickSizeQ96: next.tickSizeQ96,
      })

      if (selectedTick) {
        this.callbacks.onSelectedTickPrice(selectedTick)
        // Trigger tooltip stacking check when a bid is placed
        this.callbacks.onClickNearClearingPrice?.()
      }
    } catch (error) {
      logger.error(new Error('Error processing chart click'), {
        tags: {
          file: 'ToucanBidDistributionChartController',
          function: 'onChartClick',
        },
        extra: { error },
      })
    }
  }

  private applyZoomFromState(
    chartZoomState: ToucanBidDistributionChartZoomState,
    next: ToucanBidDistributionChartControllerUpdateParams,
  ): void {
    const chart = this.chart
    if (!chart || this.minTime === null || this.maxTime === null) {
      return
    }
    const result = applyZoomFromState({
      chart,
      hasInitializedRange: this.hasInitializedRange,
      chartZoomState,
      concentration: next.concentration,
      clearingPriceDecimal: next.clearingPriceDecimal,
      minTick: next.minTick,
      maxTick: next.maxTick,
      tickSizeDecimal: next.tickSizeDecimal,
      priceScaleFactor: next.priceScaleFactor,
      chartMode: this.createParams.chartMode,
    })

    this.hasInitializedRange = result.hasInitializedRange
  }

  private captureZoomStateToStore(next: ToucanBidDistributionChartControllerUpdateParams): void {
    const chart = this.chart
    if (!chart || this.minTime === null || this.maxTime === null) {
      return
    }
    const zoomState = captureZoomState({
      chart,
      minTime: this.minTime,
      maxTime: this.maxTime,
      rangePaddingUnits: next.rangePaddingUnits,
      priceScaleFactor: next.priceScaleFactor,
    })
    if (!zoomState) {
      return
    }

    if (
      !this.lastZoomState ||
      this.lastZoomState.isZoomed !== zoomState.isZoomed ||
      this.lastZoomState.visibleRange!.from !== zoomState.visibleRange!.from ||
      this.lastZoomState.visibleRange!.to !== zoomState.visibleRange!.to
    ) {
      this.lastZoomState = zoomState
      this.callbacks.onZoomStateChange(zoomState)
    }
  }

  private updateBidLineTooltipState(next: ToucanBidDistributionChartControllerUpdateParams): void {
    const state = computeBidLineTooltipState({ chart: this.chart, next })
    this.callbacks.onBidLineTooltipStateChange(state)
  }

  private updateClearingPriceTooltipState(next: ToucanBidDistributionChartControllerUpdateParams): void {
    const state = computeClearingPriceTooltipState({
      chart: this.chart,
      series: this.series,
      next,
    })
    this.callbacks.onClearingPriceTooltipStateChange(state)
  }

  private updateOverlays(next: ToucanBidDistributionChartControllerUpdateParams): void {
    const chart = this.chart
    if (!chart) {
      return
    }

    // Get clearing price and bid line X positions from the renderer (if available).
    // This ensures DOM overlays use the exact same positions as the canvas-rendered lines.
    const clearingPriceXFromRenderer = this.toucanChartSeries?.getClearingPriceXPosition() ?? null
    const bidLineXFromRenderer = this.toucanChartSeries?.getBidLineXPosition() ?? null

    updateBidDistributionOverlays({
      chart,
      createParams: {
        colors: this.createParams.colors,
        renderLabels: this.createParams.renderLabels,
        formatFdvValue: this.createParams.formatFdvValue,
        fdvLabel: this.createParams.fdvLabel,
      },
      next,
      elements: {
        labelsLayer: this.labelsLayer,
        clearingPriceArrow: this.clearingPriceArrow,
        bidLineDot: this.bidLineDot,
        bidOutOfRangeIndicator: this.bidOutOfRangeIndicator,
      },
      clearingPriceXFromRenderer,
      bidLineXFromRenderer,
    })

    // Update React-level clearing price tooltip state
    this.updateClearingPriceTooltipState(next)
  }

  /**
   * Calculate minimum visible range units based on tick size and price scale factor.
   * Used to ensure at least MIN_VISIBLE_BARS ticks remain visible when zooming.
   */
  private calculateMinRangeUnits({
    tickSizeDecimal,
    priceScaleFactor,
  }: {
    tickSizeDecimal: number
    priceScaleFactor: number
  }): number | undefined {
    if (!Number.isFinite(tickSizeDecimal) || tickSizeDecimal <= 0) {
      return undefined
    }
    return Math.max(1, Math.round((CHART_CONSTRAINTS.MIN_VISIBLE_BARS - 1) * tickSizeDecimal * priceScaleFactor))
  }

  private constrainVisibleRangeToData(next: ToucanBidDistributionChartControllerUpdateParams): boolean {
    const chart = this.chart
    if (!chart || this.minTime === null || this.maxTime === null) {
      return false
    }

    let currentRange
    try {
      currentRange = chart.timeScale().getVisibleRange()
    } catch (error) {
      // Expected when lightweight-charts isn't fully initialized
      logger.debug(
        'ToucanBidDistributionChartController',
        'constrainVisibleRangeToData',
        'Failed to get visible range',
        error,
      )
      return false
    }
    if (!currentRange) {
      return false
    }

    const from = currentRange.from as number
    const to = currentRange.to as number
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      return false
    }

    const rangePaddingUnits = Math.max(1, next.rangePaddingUnits)
    const fullFrom = (this.minTime as number) - rangePaddingUnits
    const fullTo = (this.maxTime as number) + rangePaddingUnits

    const minRangeUnits = this.calculateMinRangeUnits({
      tickSizeDecimal: next.tickSizeDecimal,
      priceScaleFactor: next.priceScaleFactor,
    })
    const constrained = constrainVisibleRangeToBounds({
      currentFrom: from,
      currentTo: to,
      fullFrom,
      fullTo,
      minRangeUnits,
    })
    if (constrained.corrected) {
      // lightweight-charts expects integer timestamps; enforce rounding to avoid internal null asserts.
      const safeFrom = Math.round(constrained.from as number)
      const safeTo = Math.round(constrained.to as number)
      if (!Number.isSafeInteger(safeFrom) || !Number.isSafeInteger(safeTo) || safeTo <= safeFrom) {
        return false
      }
      chart.timeScale().setVisibleRange({
        from: safeFrom as UTCTimestamp,
        to: safeTo as UTCTimestamp,
      })
      return true
    }

    return false
  }

  private applyZoomFactor(factor: number): void {
    const chart = this.chart
    const next = this.lastUpdateParams
    if (!chart || !next || this.minTime === null || this.maxTime === null) {
      return
    }

    if (!next.isZoomEnabled) {
      return
    }

    let currentRange
    try {
      currentRange = chart.timeScale().getVisibleRange()
    } catch (error) {
      // Expected when lightweight-charts isn't fully initialized; use fallback range
      logger.debug('ToucanBidDistributionChartController', 'applyZoomFactor', 'Failed to get visible range', error)
      currentRange = null
    }

    const fullFrom = (this.minTime as number) - Math.max(1, next.rangePaddingUnits)
    const fullTo = (this.maxTime as number) + Math.max(1, next.rangePaddingUnits)
    const fallbackFrom = Number.isFinite(currentRange?.from) ? (currentRange?.from as number) : fullFrom
    const fallbackTo = Number.isFinite(currentRange?.to) ? (currentRange?.to as number) : fullTo

    const minRangeUnits =
      this.calculateMinRangeUnits({
        tickSizeDecimal: next.tickSizeDecimal,
        priceScaleFactor: next.priceScaleFactor,
      }) ?? 1

    const nextRange = calculateZoomedRange({
      currentFrom: fallbackFrom,
      currentTo: fallbackTo,
      fullFrom,
      fullTo,
      zoomFactor: factor,
      minRange: minRangeUnits,
    })

    chart.timeScale().setVisibleRange({
      from: Math.round(nextRange.from) as UTCTimestamp,
      to: Math.round(nextRange.to) as UTCTimestamp,
    })

    this.captureZoomStateToStore(next)
    this.updateOverlays(next)
    this.updateBidLineTooltipState(next)
  }

  private onBidOutOfRangeIndicatorClick(): void {
    const chart = this.chart
    const next = this.lastUpdateParams
    if (!chart || !next || !next.userBidPriceDecimal) {
      return
    }

    // Check if extension would exceed MAX_RENDERABLE_BARS - if so, don't allow
    const canExtend = canExtendChartToBid({
      userBidPriceDecimal: next.userBidPriceDecimal,
      minTick: next.minTick,
      tickSizeDecimal: next.tickSizeDecimal,
    })

    recenterRangeOnBid({
      chart,
      priceScaleFactor: next.priceScaleFactor,
      bidPriceDecimal: next.userBidPriceDecimal,
      minTime: this.minTime,
      maxTime: this.maxTime,
      onExtendRangeRequired: canExtend
        ? (bidTickDecimal) => {
            this.callbacks.onExtendRangeRequired?.(bidTickDecimal)
          }
        : undefined,
    })
  }
}
