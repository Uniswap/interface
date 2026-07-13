import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import * as d3 from 'd3'
import type {
  HorizontalLiquidityChartActions,
  HorizontalLiquidityChartState,
  HorizontalLiquidityRenderingContext,
} from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/types'
import { CHART_BEHAVIOR, CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import type { Renderer } from '~/features/Liquidity/charts/D3LiquidityChartShared/types'
import type { BucketChartEntry } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'
import {
  buildBucketChartEntries,
  buildBuckets,
  buildSegmentsFromRawTicks,
} from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'

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
      rawTicks,
      baseCurrency,
      quoteCurrency,
      priceInverted,
      protocolVersion,
    } = context
    const { dimensions, hoveredSegment, isChartHovered, tickScale } = getState()

    if (!tickScale || liquidityData.length === 0) {
      return
    }

    // Build segments from raw tick data
    const segments = buildSegmentsFromRawTicks(rawTicks)
    if (segments.length === 0) {
      return
    }

    // Calculate the VISIBLE tick range based on current zoom/pan state
    const chartWidth = dimensions.width
    const chartHeight = dimensions.height
    const visibleMinTick = Math.max(tickScale.axisToTick(0), nearestUsableTick(TickMath.MIN_TICK, tickSpacing))
    const visibleMaxTick = Math.min(tickScale.axisToTick(chartWidth), nearestUsableTick(TickMath.MAX_TICK, tickSpacing))

    // Build buckets for the VISIBLE range on a fixed grid, so each bar keeps the same tick range
    // as you scroll and translates smoothly with the pan instead of jittering horizontally. Without
    // this, boundaries are anchored to the snapped viewport min and the step is derived from the
    // snapped range, so both shift frame-to-frame while panning and every bar's x/width pops.
    const buckets = buildBuckets({
      segments,
      visibleMinTick,
      visibleMaxTick,
      desiredBars: CHART_BEHAVIOR.DESIRED_BUCKETS,
      tickSpacing,
      fixedGrid: true,
    })

    // Convert to chart data with segment tracking
    const renderedBuckets: BucketChartEntry[] = buildBucketChartEntries({
      buckets,
      liquidityData,
      baseCurrency,
      quoteCurrency,
      priceInverted,
      protocolVersion,
    })

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
    const liquidityYScale = d3.scaleLinear().domain([0, maxLiquidity]).range([chartHeight, 0])

    // Compute the X position where the current tick falls
    const currentTickX = tickScale.tickToAxis(currentTick)

    const isInHoveredSegment = (d: BucketChartEntry): boolean =>
      !!(
        hoveredSegment &&
        d.segmentStartTick === hoveredSegment.startTick &&
        d.segmentEndTick === hoveredSegment.endTick
      )

    const isActiveBucket = (d: BucketChartEntry): boolean => currentTick >= d.startTick && currentTick < d.endTick

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
    // Clamp to chartHeight so a transiently-lagging smoothed scale (while the eased max catches up
    // to a newly-larger target) can't push bars past the top of the chart.
    const getBarHeight = (d: BucketChartEntry): number => {
      return Math.max(3, Math.min(chartHeight, chartHeight - liquidityYScale(Number(d.liquidityActive))))
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
