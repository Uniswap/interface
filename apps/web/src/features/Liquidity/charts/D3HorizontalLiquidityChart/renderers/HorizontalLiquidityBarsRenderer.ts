import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import * as d3 from 'd3'
import type {
  HorizontalLiquidityChartActions,
  HorizontalLiquidityChartState,
  HorizontalLiquidityRenderingContext,
} from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/types'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import type { Renderer } from '~/features/Liquidity/charts/D3LiquidityChartShared/types'
import { buildBarPathsByOpacity } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/barPaths'
import { createBucketEntriesBuilder } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/createBucketEntriesBuilder'
import type { BucketChartEntry } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'

type HorizontalBarsState = Pick<
  HorizontalLiquidityChartState,
  'dimensions' | 'renderedBuckets' | 'hoveredSegment' | 'isChartHovered' | 'tickScale'
>

// Low-pass smoothing for the liquidity height-scale. The "max liquidity" that sets bar heights is
// derived from only the currently-visible buckets (auto-fit), so it jumps as buckets cross the
// viewport edge while scrolling, making bar heights pop. We ease the displayed value toward that
// target over a short time constant so heights glide into their new fit, and keep redrawing via
// requestAnimationFrame after scrolling stops so the value finishes converging.
const MAX_LIQUIDITY_SMOOTHING_TAU_MS = 70 // time constant: smaller = snappier, larger = smoother
const MAX_LIQUIDITY_SNAP_THRESHOLD = 0.005 // within 0.5% of target -> snap and stop the settle loop

export function createHorizontalLiquidityBarsRenderer({
  g,
  context,
  getState,
  getActions,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: HorizontalLiquidityRenderingContext
  getState: () => HorizontalBarsState
  getActions: () => HorizontalLiquidityChartActions
}): Renderer {
  const barsGroup = g.append('g').attr('class', 'horizontal-liquidity-bars-group')

  // Persisted across the per-frame renderer re-init via the shared rendering context.
  const smoothing = context.liquidityScaleSmoothing
  const buildEntries = createBucketEntriesBuilder({
    rawTicks: context.rawTicks,
    liquidityData: context.liquidityData,
    tickSpacing: context.tickSpacing,
    groupTicks: context.groupTicks,
    // The tooltip describes the hovered bar as drawn: with bucket-scoped bars, a grouped bar's whole bucket.
    groupedAmountScope: context.bucketScopedBars ? 'bucket' : 'segment',
  })

  const cancelSettleFrame = (): void => {
    if (smoothing.settleFrameId !== undefined) {
      cancelAnimationFrame(smoothing.settleFrameId)
      smoothing.settleFrameId = undefined
    }
  }

  // Redraw once on the next frame so the eased value keeps converging after scrolling stops
  // (during active scroll, React-driven draws supply the frames and this gets superseded).
  const scheduleSettleFrame = (): void => {
    cancelSettleFrame()
    smoothing.settleFrameId = requestAnimationFrame(() => {
      smoothing.settleFrameId = undefined
      getActions().drawAll()
    })
  }

  // Ease the height-scale max toward `target`, returning the value to render this frame.
  const advanceDisplayedMaxLiquidity = (target: number): number => {
    const now = Date.now()
    const previous = smoothing.displayedMaxLiquidity
    const lastFrameTimeMs = smoothing.lastFrameTimeMs
    smoothing.lastFrameTimeMs = now

    // First draw or post-reset: snap, no animation.
    if (previous === undefined || lastFrameTimeMs === undefined) {
      cancelSettleFrame()
      smoothing.displayedMaxLiquidity = target
      return target
    }

    // Close enough: snap and stop the settle loop so we don't redraw forever.
    if (Math.abs(target - previous) / target < MAX_LIQUIDITY_SNAP_THRESHOLD) {
      cancelSettleFrame()
      smoothing.displayedMaxLiquidity = target
      return target
    }

    // Frame-rate-independent exponential approach (never overshoots the target).
    const dtMs = Math.max(0, now - lastFrameTimeMs)
    const alpha = 1 - Math.exp(-dtMs / MAX_LIQUIDITY_SMOOTHING_TAU_MS)
    const next = previous + (target - previous) * alpha
    smoothing.displayedMaxLiquidity = next
    scheduleSettleFrame()
    return next
  }

  const draw = (): void => {
    barsGroup.selectAll('*').remove()

    const {
      chartId,
      liquidityData,
      currentTick,
      token0Color,
      token1Color,
      tickSpacing,
      baseCurrency,
      quoteCurrency,
      priceInverted,
      protocolVersion,
      topInset,
      groupTicks,
      bucketScopedBars,
    } = context
    const { dimensions, hoveredSegment, isChartHovered, tickScale } = getState()

    if (!tickScale || liquidityData.length === 0) {
      return
    }

    // Calculate the VISIBLE tick range based on current zoom/pan state
    const chartWidth = dimensions.width
    const chartHeight = dimensions.height
    const visibleMinTick = Math.max(tickScale.axisToTick(0), nearestUsableTick(TickMath.MIN_TICK, tickSpacing))
    const visibleMaxTick = Math.min(tickScale.axisToTick(chartWidth), nearestUsableTick(TickMath.MAX_TICK, tickSpacing))

    // Buckets for the VISIBLE range on a fixed grid, so each bar keeps the same tick range as you scroll and
    // translates smoothly with the pan instead of jittering horizontally. Without it, boundaries anchored to the
    // snapped viewport min and a step from the snapped range both shift frame-to-frame, so every bar pops.
    const renderedBuckets = buildEntries({
      visibleMinTick,
      visibleMaxTick,
      ticksPerPixel:
        chartWidth > 0 ? Math.abs(tickScale.axisToTick(chartWidth) - tickScale.axisToTick(0)) / chartWidth : 1,
      baseCurrency,
      quoteCurrency,
      priceInverted,
      protocolVersion,
    })
    if (!renderedBuckets) {
      return
    }

    // Store rendered buckets in state
    getActions().setChartState({ renderedBuckets })

    if (renderedBuckets.length === 0) {
      return
    }

    // Y scale for liquidity amounts — bars grow upward from bottom. The target max comes from only
    // the visible buckets (auto-fit), so feeding it straight in makes bar heights pop as buckets
    // cross the viewport edge during scroll; ease the displayed value toward it so heights glide.
    const liquidityValues = renderedBuckets.map((d) => Number(d.liquidityActive)).filter((v) => v > 0)
    const targetMaxLiquidity = liquidityValues.length > 0 ? liquidityValues.reduce((a, b) => Math.max(a, b), 0) : 1
    const maxLiquidity = advanceDisplayedMaxLiquidity(targetMaxLiquidity)
    // Bars fill from the bottom up to `topInset`, leaving that band clear for the overlaid header
    // (the chart's dotted background still spans the full height behind it).
    const liquidityYScale = d3.scaleLinear().domain([0, maxLiquidity]).range([chartHeight, topInset])

    // Compute the X position where the current tick falls
    const currentTickX = tickScale.tickToAxis(currentTick)

    // The hovered bar's span (see D3HorizontalLiquidityChart): a bucket-scoped grouped bar's bucket, else its segment.
    const isInHoveredSegment = (d: BucketChartEntry): boolean =>
      !!(
        hoveredSegment &&
        (groupTicks && bucketScopedBars ? d.startTick : d.segmentStartTick) === hoveredSegment.startTick &&
        (groupTicks && bucketScopedBars ? d.endTick : d.segmentEndTick) === hoveredSegment.endTick
      )

    // A full-granularity bar is a pixel wide, so the current price's whole segment stands in for its bar.
    const isActiveBucket = (d: BucketChartEntry): boolean =>
      groupTicks
        ? currentTick >= d.startTick && currentTick < d.endTick
        : currentTick >= d.segmentStartTick && currentTick < d.segmentEndTick

    const isHighlighted = (d: BucketChartEntry): boolean => {
      if (isChartHovered) {
        return isInHoveredSegment(d)
      }
      return isActiveBucket(d)
    }

    const getBarOpacity = (d: BucketChartEntry): number => {
      const baseOpacity = isHighlighted(d) ? 1 : 0.7
      return d.liquidityActive <= 0 ? baseOpacity * 0.3 : baseOpacity
    }

    // Shared bar attribute helpers
    const getBarX = (d: BucketChartEntry): number => tickScale.tickToAxis(d.startTick)
    const getBarWidth = (d: BucketChartEntry): number => {
      const barEndX = tickScale.tickToAxis(d.endTick)
      return Math.max(3, barEndX - tickScale.tickToAxis(d.startTick) - CHART_DIMENSIONS.LIQUIDITY_BAR_SPACING)
    }
    // Clamp to the drawable height (below the top inset) so a transiently-lagging smoothed scale
    // (while the eased max catches up to a newly-larger target) can't push bars into the header band.
    const drawableHeight = chartHeight - topInset
    const getBarHeight = (d: BucketChartEntry): number => {
      return Math.max(3, Math.min(drawableHeight, chartHeight - liquidityYScale(Number(d.liquidityActive))))
    }
    const getBarY = (d: BucketChartEntry): number => chartHeight - getBarHeight(d)

    // Clip-paths to split bars at currentTickX — left = token1, right = token0
    const defs = barsGroup.append('defs')
    defs
      .append('clipPath')
      .attr('id', `${chartId}-bars-clip-left`)
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', Math.max(0, currentTickX))
      .attr('height', chartHeight)

    defs
      .append('clipPath')
      .attr('id', `${chartId}-bars-clip-right`)
      .append('rect')
      .attr('x', currentTickX)
      .attr('y', 0)
      .attr('width', Math.max(0, chartWidth - currentTickX))
      .attr('height', chartHeight)

    if (!groupTicks) {
      // Full granularity: bars abut with no gap or rounding, one path per opacity, so the profile reads as a
      // smooth shape.
      const getRect = (d: BucketChartEntry) => {
        const x = tickScale.tickToAxis(d.startTick)
        const width = tickScale.tickToAxis(d.endTick) - x
        return x > chartWidth || x + width < 0 ? undefined : { x, y: getBarY(d), width, height: getBarHeight(d) }
      }
      const paths = buildBarPathsByOpacity({ bars: renderedBuckets, getOpacity: getBarOpacity, getRect })
      for (const [side, color] of [
        ['left', token1Color],
        ['right', token0Color],
      ] as const) {
        barsGroup
          .append('g')
          .attr('clip-path', `url(#${chartId}-bars-clip-${side})`)
          .selectAll('path')
          .data(paths)
          .join('path')
          .attr('class', `liquidity-bar liquidity-bar-${side}`)
          .attr('d', (p) => p.d)
          .attr('opacity', (p) => p.opacity)
          .attr('fill', color)
      }
      return
    }

    // Draw bars left of current tick (token1 zone)
    barsGroup
      .append('g')
      .attr('clip-path', `url(#${chartId}-bars-clip-left)`)
      .selectAll<SVGRectElement, BucketChartEntry>('.liquidity-bar-left')
      .data(renderedBuckets, (d) => `${d.startTick}-${d.endTick}`)
      .join('rect')
      .attr('class', 'liquidity-bar liquidity-bar-left')
      .attr('opacity', getBarOpacity)
      .attr('x', getBarX)
      .attr('y', getBarY)
      .attr('width', getBarWidth)
      .attr('height', getBarHeight)
      .attr('fill', token1Color)
      .attr('rx', 2)

    // Draw bars right of current tick (token0 zone)
    barsGroup
      .append('g')
      .attr('clip-path', `url(#${chartId}-bars-clip-right)`)
      .selectAll<SVGRectElement, BucketChartEntry>('.liquidity-bar-right')
      .data(renderedBuckets, (d) => `${d.startTick}-${d.endTick}`)
      .join('rect')
      .attr('class', 'liquidity-bar liquidity-bar-right')
      .attr('opacity', getBarOpacity)
      .attr('x', getBarX)
      .attr('y', getBarY)
      .attr('width', getBarWidth)
      .attr('height', getBarHeight)
      .attr('fill', token0Color)
      .attr('rx', 2)
  }

  return { draw }
}
