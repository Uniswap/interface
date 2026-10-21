/* oxlint-disable max-lines */
import {
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  type AreaSeriesPartialOptions,
  type CandlestickData,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesPrimitive,
  type Time,
} from 'lightweight-charts'
import type { ChartHoverData } from '~/components/Charts/ChartModel'
import { PriceChartModel, type PriceChartData } from '~/components/Charts/PriceChart'
import type { RoundedCandleSeriesOptions } from '~/components/Charts/PriceChart/RoundedCandlestickSeries/rounded-candles-series'
import { computeOverlaysReconcileKey } from '~/pages/Swap/Margin/chart/overlayReconcileKey'
import { scaleOverlaysForRender, toScaledPrice, unscaleVisibleRange } from '~/pages/Swap/Margin/chart/overlayScaling'
import { PriceZonePrimitive } from '~/pages/Swap/Margin/chart/PriceZonePrimitive'
import { TimeMarkerPrimitive } from '~/pages/Swap/Margin/chart/TimeMarkerPrimitive'
import {
  nearestOverlay,
  shouldForceOverlayRebuild,
  type MarginChartOverlays,
  type NearOverlay,
  type NearOverlayHit,
} from '~/pages/Swap/Margin/chart/useMarginChartOverlays'
import { colorVolumeBars, snapVolumeBars, type MarginVolumeBar } from '~/pages/Swap/Margin/chart/useMarginVolume'
import { zoomedPriceRange } from '~/pages/Swap/Margin/chart/verticalZoom'
import { withOpacity } from '~/pages/Swap/Margin/chart/withOpacity'

// PriceChartModelParams isn't exported from the PriceChart barrel — mirror the ctor param
// contract structurally (ChartModelParams<PriceChartData> & extras) and extend with overlays.
type MarginPriceChartModelParams = ConstructorParameters<typeof PriceChartModel>[1] & {
  overlays: MarginChartOverlays
  onVisibleRangeChange?: (range?: { min: number; max: number }) => void
  volumeBars?: MarginVolumeBar[]
  // Vertical zoom (0..MAX_VERTICAL_ZOOM_STEP): 0 fits candles ∪ overlay bounds (default), max fits
  // the candles alone. Consumed by applyVerticalAutoscale.
  verticalZoomStep?: number
  // Set while a chart popover overlays the pane (spec F16): hide the crosshair + tooltip so the chart
  // never tracks or paints under the panel.
  suppressCrosshair?: boolean
}

// Pan/zoom streams fire the logical-range subscription per frame; cap React publishes.
const VISIBLE_RANGE_PUBLISH_THROTTLE_MS = 100

// Explainer dwell (spec F11/F24): re-emit the augmented hover once the crosshair has been parked
// within the move tolerance for this long. Crosshair events fire only on movement, so the timer is
// the only way "still hovering" can reach React.
const DWELL_MS = 300
const DWELL_MOVE_TOLERANCE_PX = 8

export class MarginPriceChartModel extends PriceChartModel {
  private marginPriceLines: IPriceLine[] = []
  private lastOverlaysKey: string | undefined
  // Base-class series-swap survival: on chart-type change the base updateOptions silently
  // removeSeries+recreates this.series, killing every attached price line/primitive with it.
  private lastSeries: ISeriesApi<'Area'> | ISeriesApi<'Custom'> | undefined
  // Primitives to carry across swaps (populated by primitive overlays as they land; PluginBase
  // .attached is re-callable so re-attaching to the new series is safe).
  private attachedPrimitives: Array<ISeriesPrimitive<Time>> = []
  // Shaded liquidation zone (spec F7). Instantiated once on the first reconcile, then updated in place.
  private zonePrimitive: PriceZonePrimitive | undefined
  // Position-event markers (spec F10), likewise instantiated once and updated in place.
  private markerPrimitive: TimeMarkerPrimitive | undefined
  // Optional real-volume histogram (spec F15), default OFF. Lives on its own hidden overlay price
  // scale, independent of the price series — a price-series swap (T9) never touches it. Lazily
  // created on the first non-empty bars; removed when the overlay is toggled off (empty bars).
  private volumeSeries: ISeriesApi<'Histogram'> | undefined
  private onVisibleRangeChange: ((range?: { min: number; max: number }) => void) | undefined
  private lastRangePublishMs = 0
  // Memo of the last applied vertical-autoscale inputs (scaled bounds + step + factor + series
  // identity). Reinstalling the provider only on change keeps steady-state updateOptions calls
  // (positions polls) free and re-targets a swap-recreated series.
  private lastVerticalAutoscale:
    | { step: number; min?: number; max?: number; factor: number; series: ISeriesApi<'Area'> | ISeriesApi<'Custom'> }
    | undefined
  // Pending post-paint visible-range republish (see applyVerticalAutoscale).
  private rangeRepublishRaf: number | undefined
  // True while a chart popover overlays the pane: crosshair mode is forced Hidden and hover emits are
  // short-circuited. Initial false is correct (popover starts closed) and survives the base ctor's
  // early virtual updateOptions() call.
  private suppressCrosshair = false
  // Hover hit-test inputs (T14b). rawChartData mirrors params.data — the base keeps its raw
  // original-data copy private, and the hovered/emitted items must be RAW while the series renders
  // scaled. currentOverlays keeps the composer's RAW output for hit-testing.
  private rawChartData: PriceChartData[] | undefined
  private currentOverlays: MarginChartOverlays | undefined
  // Dwell state: written only from hover events / the timer (both strictly post-ctor).
  private dwellTimer: ReturnType<typeof setTimeout> | undefined
  private dwellAnchor: { x: number; y: number } | undefined
  private dwellFired = false
  private lastNearHover: { item: PriceChartData; logicalIndex: number; hit: NearOverlayHit } | undefined
  // The base ctor's virtual updateOptions() call (PriceChartModel.ts:137) dispatches
  // to the override below BEFORE this subclass's fields initialize — and with ES class
  // field semantics (target ESNext) the field definitions after super() would wipe any
  // state written that early, orphaning the first set of lines. Skip reconciles until
  // the flag flips, then reconcile once explicitly; the ctor also re-seeds every field
  // (lastSeries, onVisibleRangeChange, rawChartData, currentOverlays) that first
  // virtual call wrote.
  private priceLinesReady = false

  // Stable handle for subscribe/unsubscribe. Only ever invoked post-ctor (subscribed in the
  // ctor body, after field initializers ran), so no wipe hazard.
  private readonly handleVisibleLogicalRangeChange = (): void => {
    const now = Date.now()
    if (now - this.lastRangePublishMs < VISIBLE_RANGE_PUBLISH_THROTTLE_MS) {
      return
    }
    this.lastRangePublishMs = now
    this.publishVisibleRange(this.onVisibleRangeChange)
  }

  constructor(chartDiv: HTMLDivElement, params: MarginPriceChartModelParams) {
    super(chartDiv, params)
    this.priceLinesReady = true
    this.lastSeries = this.series
    this.onVisibleRangeChange = params.onVisibleRangeChange
    this.rawChartData = params.data
    this.currentOverlays = params.overlays
    this.reconcileOverlays({ overlays: params.overlays, colors: params.colors })
    this.applyVerticalAutoscale({ overlays: params.overlays, step: params.verticalZoomStep ?? 0 })
    this.reconcileVolume({ bars: params.volumeBars, candles: params.data, colors: params.colors })
    this.api.timeScale().subscribeVisibleLogicalRangeChange(this.handleVisibleLogicalRangeChange)
    this.publishVisibleRange(params.onVisibleRangeChange)
  }

  override updateOptions(params: MarginPriceChartModelParams): void {
    super.updateOptions(params) // may remove+recreate this.series (chart-type change)
    this.onVisibleRangeChange = params.onVisibleRangeChange
    this.rawChartData = params.data
    this.currentOverlays = params.overlays
    const seriesSwapped = shouldForceOverlayRebuild({ prevSeries: this.lastSeries, nextSeries: this.series })
    this.lastSeries = this.series

    // Suppress the crosshair while a chart popover overlays the pane (spec F16). Force-clear on the
    // open transition so a parked crosshair/tooltip disappears immediately; restore Magnet on close.
    const nextSuppress = params.suppressCrosshair ?? false
    const justSuppressed = nextSuppress && !this.suppressCrosshair
    this.suppressCrosshair = nextSuppress

    // Terminal styling layered on the base PriceChart defaults: tighter y-margins so candles fill
    // the pane, faint horizontal gridlines for price levels, axis hairlines, and crosshair read-off
    // tags (the pane uses a bare <Chart> with no ChartHeader to show the hovered price/time).
    const { colors } = params
    this.api.applyOptions({
      rightPriceScale: {
        scaleMargins: { top: 0.15, bottom: 0.12 },
        borderVisible: true,
        borderColor: colors.surface3.val,
      },
      timeScale: { borderVisible: true, borderColor: colors.surface3.val },
      grid: {
        horzLines: {
          visible: true,
          color: withOpacity({ amount: 8, color: colors.neutral3.val }),
          style: LineStyle.Solid,
        },
        vertLines: { visible: false },
      },
      crosshair: {
        mode: nextSuppress ? CrosshairMode.Hidden : CrosshairMode.Magnet,
        horzLine: { labelVisible: true, labelBackgroundColor: colors.surface3Solid.val },
        vertLine: { labelVisible: true, labelBackgroundColor: colors.surface3Solid.val },
      },
    })
    if (justSuppressed) {
      this.api.clearCrosshairPosition()
      this.onSeriesHover(undefined)
    }
    // Rectangular candles (pro-terminal look) instead of the default rounded bodies.
    this.series.applyOptions({ radius: () => 0 } as Partial<RoundedCandleSeriesOptions> & AreaSeriesPartialOptions)

    if (this.priceLinesReady) {
      if (seriesSwapped) {
        // The old line handles died with the removed series — drop the refs (removePriceLine on
        // them would throw) and clear the key so the reconcile below rebuilds on the new series.
        this.marginPriceLines = []
        this.lastOverlaysKey = undefined
        for (const primitive of this.attachedPrimitives) {
          this.series.attachPrimitive(primitive)
        }
      }
      this.reconcileOverlays({ overlays: params.overlays, colors: params.colors })
      this.applyVerticalAutoscale({ overlays: params.overlays, step: params.verticalZoomStep ?? 0 })
      // Independent of the swap/overlay reconcile above; setData is idempotent so this runs
      // unconditionally within the ready gate (skipped during the base ctor's virtual dispatch).
      this.reconcileVolume({ bars: params.volumeBars, candles: params.data, colors: params.colors })
    }
    this.publishVisibleRange(params.onVisibleRangeChange)
  }

  override remove(): void {
    this.clearDwell()
    if (this.rangeRepublishRaf !== undefined) {
      cancelAnimationFrame(this.rangeRepublishRaf)
      this.rangeRepublishRaf = undefined
    }
    this.api.timeScale().unsubscribeVisibleLogicalRangeChange(this.handleVisibleLogicalRangeChange)
    super.remove()
  }

  // Crosshair → overlay hit-test → augmented emit (spec F11/F24). The base PriceChartModel override
  // REPLACES the hovered item with its private original-data copy (the scaled→raw hover mapping), so
  // any augmentation placed on hoverData.item would be dropped there — instead, after super runs,
  // re-emit the augmented RAW item on the same onCrosshairMove channel (same tick ⇒ one batched
  // React commit). The dwell timer re-emits once more with dwellElapsed=true after 300ms parked,
  // since subscribeCrosshairMove fires only on movement.
  override onSeriesHover(hoverData?: ChartHoverData<CandlestickData>): void {
    // While a popover overlays the pane, never surface a crosshair/tooltip — even for hovers on the
    // still-visible chart area beside the panel.
    if (this.suppressCrosshair) {
      this.clearDwell()
      super.onSeriesHover(undefined)
      return
    }
    if (!hoverData) {
      this.clearDwell()
      super.onSeriesHover(undefined)
      return
    }
    const hit = this.hitTestOverlays(hoverData)
    super.onSeriesHover(hoverData)
    const rawItem = this.rawChartData?.[hoverData.logicalIndex]
    if (!hit || !rawItem) {
      this.clearDwell()
      return
    }
    const anchor = this.dwellAnchor
    const moved = !anchor || Math.hypot(hoverData.x - anchor.x, hoverData.y - anchor.y) > DWELL_MOVE_TOLERANCE_PX
    const last = this.lastNearHover
    const retargeted = !last || last.hit.role !== hit.role || last.hit.price !== hit.price
    if (moved || retargeted) {
      this.dwellFired = false
      this.dwellAnchor = { x: hoverData.x, y: hoverData.y }
      this.restartDwellTimer()
    }
    this.lastNearHover = { item: rawItem, logicalIndex: hoverData.logicalIndex, hit }
    this.emitNearOverlay({ item: rawItem, logicalIndex: hoverData.logicalIndex, hit, dwellElapsed: this.dwellFired })
  }

  private hitTestOverlays(hoverData: ChartHoverData<CandlestickData>): NearOverlayHit | undefined {
    const overlays = this.currentOverlays
    if (!overlays) {
      return undefined
    }
    const factor = this.lowPriceRangeScaleFactor
    return nearestOverlay({
      hover: { x: hoverData.x, y: hoverData.y },
      lines: overlays.priceLines,
      markers: overlays.markers,
      zone: overlays.zone,
      // Scale discipline: overlays carry RAW prices; the series maps SCALED prices to coordinates.
      priceToY: (price) => this.series.priceToCoordinate(toScaledPrice({ price, factor })),
      timeToX: (time) => this.api.timeScale().timeToCoordinate(time),
    })
  }

  private emitNearOverlay({
    item,
    logicalIndex,
    hit,
    dwellElapsed,
  }: {
    item: PriceChartData
    logicalIndex: number
    hit: NearOverlayHit
    dwellElapsed: boolean
  }): void {
    // Fresh object refs every emit — React only re-renders the tooltip on a state identity change.
    const augmented: PriceChartData & { nearOverlay: NearOverlay } = {
      ...item,
      nearOverlay: { ...hit, dwellElapsed },
    }
    this.onCrosshairMove?.(augmented, logicalIndex)
  }

  private restartDwellTimer(): void {
    if (this.dwellTimer !== undefined) {
      clearTimeout(this.dwellTimer)
    }
    this.dwellTimer = setTimeout(() => {
      this.dwellTimer = undefined
      this.dwellFired = true
      if (this.lastNearHover) {
        this.emitNearOverlay({ ...this.lastNearHover, dwellElapsed: true })
      }
    }, DWELL_MS)
  }

  private clearDwell(): void {
    if (this.dwellTimer !== undefined) {
      clearTimeout(this.dwellTimer)
      this.dwellTimer = undefined
    }
    this.dwellAnchor = undefined
    this.dwellFired = false
    this.lastNearHover = undefined
  }

  // Crosshair events fire only on movement, so when overlays change under a parked cursor the last dwell
  // explainer would persist. Drop it now: re-emit the RAW hovered candle (no overlay augmentation) so the
  // explainer line disappears while OHLC/PnL rows stay; a later move re-hit-tests and re-dwells. No-op
  // before the first hover (also covers the ctor's first reconcile).
  private clearStaleDwellExplainer(): void {
    const last = this.lastNearHover
    this.clearDwell()
    // Don't re-surface a crosshair item while a popover suppresses the crosshair (the concurrent
    // `suppressCrosshair` mechanism in onSeriesHover) — just clear. Also a no-op before the first hover.
    if (last && !this.suppressCrosshair) {
      this.onCrosshairMove?.(last.item, last.logicalIndex)
    }
  }

  // lightweight-charts v4 has no visible-PRICE-range API — derive it from the pane's vertical
  // edges. Either edge unresolvable (no layout/data yet) publishes undefined so consumers fall
  // back to render-everything. coordinateToPrice reads SCALED series space (base low-price-range
  // workaround) — unscale so the composer keeps operating in raw prices.
  private publishVisibleRange(cb?: (range?: { min: number; max: number }) => void): void {
    if (!cb) {
      return
    }
    const top = this.series.coordinateToPrice(0)
    const bottom = this.series.coordinateToPrice(this.api.paneSize().height)
    const scaledRange =
      top !== null && bottom !== null ? { min: Math.min(top, bottom), max: Math.max(top, bottom) } : undefined
    cb(unscaleVisibleRange({ range: scaledRange, factor: this.lowPriceRangeScaleFactor }))
  }

  // Keyed reconcile of the composer's output. The key covers every rendered price-line attribute
  // plus the autoscale bounds, so an in-flight dim (opacity), a label-collision flip, or a text-color
  // change re-renders while steady-state updateOptions calls stay free. The liq zone carries its own
  // edge/side/emphasis segment: prefs are runtime-mutable (T15), so toggling liqZone flips the zone
  // to/from undefined while the mark/liq lines stay put — it can no longer ride their key. Markers
  // likewise carry their own time/price/kind segment (event times are not otherwise in the key); both
  // zone and marker colors ride the theme via the line colors. The scale-factor segment forces a full
  // rebuild when the base low-price-range factor flips on a timeframe switch — the old lines carry
  // prices scaled by the previous factor.
  private reconcileOverlays({
    overlays,
    colors,
  }: {
    overlays: MarginChartOverlays
    colors: MarginPriceChartModelParams['colors']
  }): void {
    const factor = this.lowPriceRangeScaleFactor
    const key = computeOverlaysReconcileKey({ overlays, factor })
    if (key === this.lastOverlaysKey) {
      return
    }
    this.lastOverlaysKey = key
    this.clearStaleDwellExplainer()
    // The series renders in scaled space when the low-price-range workaround engaged — every
    // overlay surface handed to lightweight-charts below must be scaled the same way.
    const scaled = scaleOverlaysForRender({ overlays, factor })
    for (const line of this.marginPriceLines) {
      this.series.removePriceLine(line)
    }
    this.marginPriceLines = scaled.priceLines.map((line) => {
      // Per-line dimming (frozen previews while a plan executes, stale-mark dim): fade the line +
      // axis-tag bg, keeping the tag text full-strength so it stays readable. withOpacity (not
      // opacify) because spore neutral line colors are rgba, which opacify leaves unchanged.
      const fade = (color: string): string =>
        line.opacity !== undefined ? withOpacity({ amount: Math.round(line.opacity * 100), color }) : color
      return this.series.createPriceLine({
        price: line.price,
        color: fade(line.color),
        lineWidth: line.lineWidth ?? 1,
        lineStyle: line.lineStyle,
        axisLabelVisible: line.axisLabelVisible ?? true,
        axisLabelColor: fade(line.axisLabelColor),
        axisLabelTextColor: line.axisLabelTextColor,
        title: line.title,
      })
    })
    // Shaded liquidation zone (spec F7), drawn behind the candles. Instantiate once and register in
    // attachedPrimitives so the swap path re-attaches it to a recreated series; then update in place.
    if (!this.zonePrimitive) {
      this.zonePrimitive = new PriceZonePrimitive()
      this.attachedPrimitives.push(this.zonePrimitive)
      this.series.attachPrimitive(this.zonePrimitive)
    }
    this.zonePrimitive.update({ zone: scaled.zone, color: colors.statusCritical.val })
    // Position-event markers (spec F10), drawn above the candles. Same lazy-instantiate + register
    // pattern as the zone so the swap path re-attaches it to a recreated series.
    if (!this.markerPrimitive) {
      this.markerPrimitive = new TimeMarkerPrimitive()
      this.attachedPrimitives.push(this.markerPrimitive)
      this.series.attachPrimitive(this.markerPrimitive)
    }
    this.markerPrimitive.update({
      markers: scaled.markers,
      colors: { open: colors.statusSuccess.val, decrease: colors.neutral2.val, ring: colors.surface1.val },
    })
  }

  // Single writer of the series autoscaleInfoProvider. createPriceLine markers do NOT extend
  // autoscale, so the composer's padded bounds are folded into the scale here — attenuated by the
  // vertical-zoom step (0 = full candles ∪ bounds union, keeping e.g. a far liq line on-screen;
  // max = candle-fit; repo precedent for the union: LiquidityPositionRangeChart). A step change
  // also re-enables autoScale so zooming recovers from a manual price-axis drag. CONTRACT: the
  // composer's autoscaleBounds must stay independent of visiblePriceRange (pre-merge line set) —
  // a range-dependent bounds would loop through zoom → visible range → bounds → rescale forever.
  private applyVerticalAutoscale({ overlays, step }: { overlays: MarginChartOverlays; step: number }): void {
    const factor = this.lowPriceRangeScaleFactor
    const rawBounds = overlays.autoscaleBounds
    const bounds = rawBounds && {
      min: toScaledPrice({ price: rawBounds.min, factor }),
      max: toScaledPrice({ price: rawBounds.max, factor }),
    }
    const prev = this.lastVerticalAutoscale
    if (
      prev &&
      prev.step === step &&
      prev.min === bounds?.min &&
      prev.max === bounds?.max &&
      prev.factor === factor &&
      prev.series === this.series
    ) {
      return
    }
    const stepChanged = prev !== undefined && prev.step !== step
    this.lastVerticalAutoscale = { step, min: bounds?.min, max: bounds?.max, factor, series: this.series }
    if (bounds) {
      this.series.applyOptions({
        autoscaleInfoProvider: (original: () => { priceRange: { minValue: number; maxValue: number } } | null) => {
          const res = original()
          if (!res) {
            return res
          }
          return { ...res, priceRange: zoomedPriceRange({ candleRange: res.priceRange, bounds, step }) }
        },
      })
    } else {
      // lightweight-charts' options merge skips undefined values, so `autoscaleInfoProvider:
      // undefined` can never CLEAR a previously installed provider (stale bounds would survive a
      // switch to a bounds-less market) — install an explicit pass-through instead.
      this.series.applyOptions({
        autoscaleInfoProvider: (original: () => { priceRange: { minValue: number; maxValue: number } } | null) =>
          original(),
      })
    }
    if (stepChanged) {
      this.api.priceScale('right').applyOptions({ autoScale: true })
    }
    // The new provider is applied on lightweight-charts' next animation frame, so the synchronous
    // publishVisibleRange at the end of updateOptions still reads the PRE-zoom range — and a
    // price-only rescale fires no time-scale event to self-heal. Re-publish after that paint so the
    // composer's label collision sees the post-zoom range.
    if (this.rangeRepublishRaf !== undefined) {
      cancelAnimationFrame(this.rangeRepublishRaf)
    }
    this.rangeRepublishRaf = requestAnimationFrame(() => {
      this.rangeRepublishRaf = undefined
      this.publishVisibleRange(this.onVisibleRangeChange)
    })
  }

  // Real-volume histogram (spec F15) on its own hidden overlay price scale ('' scale id), pinned to
  // the bottom 20%. Lazily created on the first non-empty bars, setData on every call (idempotent),
  // and removed when the overlay is toggled off (empty/undefined bars). Bars are colored by their
  // candle's direction (colorVolumeBars, from params.data) at 40% alpha — a data-only volume↔candle
  // coupling; the series lifecycle stays independent. Not registered as an attachedPrimitive: it
  // rides no series, so the base's chart-type swap (removeSeries+recreate of the price series) leaves
  // it untouched. Teardown is via api.remove() (disposes every series), so remove() must not — and
  // does not — removeSeries this handle.
  private reconcileVolume({
    bars,
    candles,
    colors,
  }: {
    bars: MarginVolumeBar[] | undefined
    candles: PriceChartData[]
    colors: MarginPriceChartModelParams['colors']
  }): void {
    if (bars?.length) {
      if (!this.volumeSeries) {
        this.volumeSeries = this.api.addSeries(HistogramSeries, {
          priceScaleId: '',
          lastValueVisible: false,
          priceLineVisible: false,
        })
        this.volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
      }
      // Snap bars to candle times so the exact-time coloring match hits every bar. If every bar
      // predates the first candle, snapped is empty → setData([]) clears the already-created series.
      const snapped = snapVolumeBars({ bars, candleTimes: candles.map((c) => c.time) })
      this.volumeSeries.setData(
        colorVolumeBars({
          bars: snapped,
          candles,
          colors: {
            statusSuccess: colors.statusSuccess.val,
            statusCritical: colors.statusCritical.val,
            neutral2: colors.neutral2.val,
          },
        }),
      )
    } else if (this.volumeSeries) {
      this.api.removeSeries(this.volumeSeries)
      this.volumeSeries = undefined
    }
  }
}
