import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import * as d3 from 'd3'
import { logger } from 'utilities/src/logger/logger'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import { buildBarPathsByOpacity } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/barPaths'
import { getOpacityForTick } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/colorUtils'
import { createBucketEntriesBuilder } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/createBucketEntriesBuilder'
import type { BucketChartEntry } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'
import type {
  ChartActions,
  ChartState,
  Renderer,
  RenderingContext,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getCurrentTickDotY } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickToY'

// Low-pass smoothing for the liquidity width-scale. The "max liquidity" that sets bar widths is
// derived from only the currently-visible buckets (auto-fit), so it jumps as buckets cross the
// viewport edge while scrolling, making bar widths pop. We ease the displayed value toward that
// target over a short time constant so widths glide into their new fit, and keep redrawing via
// requestAnimationFrame after scrolling stops so the value finishes converging.
const MAX_LIQUIDITY_SMOOTHING_TAU_MS = 70 // time constant: smaller = snappier, larger = smoother
const MAX_LIQUIDITY_SNAP_THRESHOLD = 0.005 // within 0.5% of target -> snap and stop the settle loop

export function createLiquidityBarsRenderer({
  g,
  context,
  getState,
  getActions,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: RenderingContext
  getState: () => ChartState
  getActions: () => ChartActions
}): Renderer {
  const barsGroup = g.append('g').attr('class', 'liquidity-bars-group')
  const { setChartError } = getActions()

  // Persisted across the per-frame renderer re-init via the shared rendering context.
  const smoothing = context.liquidityScaleSmoothing
  const buildEntries = createBucketEntriesBuilder({
    rawTicks: context.rawTicks,
    liquidityData: context.liquidityData,
    tickSpacing: context.tickSpacing,
    groupTicks: context.groupTicks,
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

  // Ease the width-scale max toward `target`, returning the value to render this frame.
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
    try {
      // Clear previous bars
      barsGroup.selectAll('*').remove()

      const {
        chartId,
        liquidityData,
        token0Color,
        token1Color,
        tickScale,
        currentTick,
        tickSpacing,
        groupTicks,
        dimensions: contextDimensions,
      } = context
      const {
        minTick,
        maxTick,
        dimensions,
        hoveredSegment,
        baseCurrency,
        quoteCurrency,
        priceInverted,
        protocolVersion,
      } = getState()

      if (liquidityData.length === 0 || minTick === undefined || maxTick === undefined) {
        return
      }

      // Calculate the VISIBLE tick range based on current zoom/pan state
      // yToTick(0) = highest visible tick (top of viewport)
      // yToTick(height) = lowest visible tick (bottom of viewport)
      const chartHeight = contextDimensions.height || CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT
      const visibleMaxTick = Math.min(tickScale.axisToTick(0), nearestUsableTick(TickMath.MAX_TICK, tickSpacing)) // Top of viewport = highest visible tick
      const visibleMinTick = Math.max(
        tickScale.axisToTick(chartHeight),
        nearestUsableTick(TickMath.MIN_TICK, tickSpacing),
      ) // Bottom of viewport = lowest visible tick

      // Buckets for the VISIBLE range on a fixed grid, so each bar keeps the same tick range as you scroll and
      // translates smoothly with the pan instead of jittering vertically. Amounts are summed per bucket's
      // max-liquidity segment (see buildBucketChartEntries).
      const renderedBuckets = buildEntries({
        visibleMinTick,
        visibleMaxTick,
        ticksPerPixel: Math.abs(tickScale.axisToTick(0) - tickScale.axisToTick(chartHeight)) / chartHeight,
        baseCurrency,
        quoteCurrency,
        priceInverted,
        protocolVersion,
      })
      if (!renderedBuckets) {
        return
      }

      // Store rendered buckets in state for overlay hover detection
      getActions().setChartState({ renderedBuckets })

      if (renderedBuckets.length === 0) {
        return
      }

      // X scale for liquidity amounts - target uses max from visible buckets with liquidity > 0.
      // Feeding that target straight into the scale makes bar widths pop as buckets cross the
      // viewport edge during scroll; ease the displayed value toward it so widths glide instead.
      const liquidityValues = renderedBuckets.map((d) => Number(d.liquidityActive)).filter((v) => v > 0)
      const targetMaxLiquidity = liquidityValues.length > 0 ? Math.max(...liquidityValues) : 1
      const maxLiquidity = advanceDisplayedMaxLiquidity(targetMaxLiquidity)
      const maxBarWidth = CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET
      const liquidityXScale = d3.scaleLinear().domain([0, maxLiquidity]).range([0, maxBarWidth])

      // Calculate bucket height based on tick range
      // Each bucket spans [startTick, endTick], convert to Y using the linear scale
      // Subtract divider height to create 1px gap between bars
      const calculateBucketHeight = (bucket: BucketChartEntry): number => {
        const topY = tickScale.tickToAxis(bucket.endTick) // Higher tick -> lower Y
        const bottomY = tickScale.tickToAxis(bucket.startTick) // Lower tick -> higher Y
        return Math.max(3, bottomY - topY - CHART_DIMENSIONS.LIQUIDITY_BAR_SPACING)
      }

      // Use previously-stored buckets for dotY so the color split aligns with other renderers
      // (CurrentTickRenderer, PriceLineRenderer) that read from getState().renderedBuckets.
      // Falls back to freshly-built buckets on the first render before state is populated.
      const { renderedBuckets: existingBuckets } = getState()
      const dotY = getCurrentTickDotY({ currentTick, renderedBuckets: existingBuckets ?? renderedBuckets, tickScale })

      // Shared bar attributes
      const getBarOpacity = (d: BucketChartEntry): number => {
        const isInHoveredSegment =
          hoveredSegment &&
          d.segmentStartTick === hoveredSegment.startTick &&
          d.segmentEndTick === hoveredSegment.endTick
        if (isInHoveredSegment) {
          return 1
        }
        const centerTick = (d.startTick + d.endTick) / 2
        const baseOpacity = getOpacityForTick({ tick: centerTick, minTick, maxTick, tickSpacing })
        return d.liquidityActive <= 0 ? baseOpacity * 0.3 : baseOpacity
      }

      // Clamp to maxBarWidth so a transiently-lagging smoothed scale (while the eased value catches
      // up to a newly-larger target) can't push bars past the chart edge.
      const getBarWidth = (d: BucketChartEntry): number => {
        return Math.max(3, Math.min(maxBarWidth, liquidityXScale(Number(d.liquidityActive))))
      }

      const getBarX = (d: BucketChartEntry): number => {
        return (
          dimensions.width +
          CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH -
          CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET -
          getBarWidth(d)
        )
      }

      // Clip paths to split bars at dotY
      const defs = barsGroup.append('defs')
      defs
        .append('clipPath')
        .attr('id', `${chartId}-bars-clip-above`)
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH)
        .attr('height', Math.max(0, dotY))

      defs
        .append('clipPath')
        .attr('id', `${chartId}-bars-clip-below`)
        .append('rect')
        .attr('x', 0)
        .attr('y', dotY)
        .attr('width', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH)
        .attr('height', Math.max(0, chartHeight - dotY))

      if (!groupTicks) {
        // Full granularity: bars abut with no gap, one path per opacity, so the profile reads as a smooth shape.
        const getRect = (d: BucketChartEntry) => {
          const y = tickScale.tickToAxis(d.endTick)
          const height = tickScale.tickToAxis(d.startTick) - y
          return y > chartHeight || y + height < 0 ? undefined : { x: getBarX(d), y, width: getBarWidth(d), height }
        }
        const paths = buildBarPathsByOpacity({ bars: renderedBuckets, getOpacity: getBarOpacity, getRect })
        for (const [clip, color] of [
          ['above', token0Color],
          ['below', token1Color],
        ] as const) {
          barsGroup
            .append('g')
            .attr('clip-path', `url(#${chartId}-bars-clip-${clip})`)
            .selectAll('path')
            .data(paths)
            .join('path')
            .attr('class', `liquidity-bar liquidity-bar-${clip}`)
            .attr('d', (p) => p.d)
            .attr('opacity', (p) => p.opacity)
            .attr('fill', color)
        }
        return
      }

      // Draw bars above dotY (token0 zone)
      barsGroup
        .append('g')
        .attr('clip-path', `url(#${chartId}-bars-clip-above)`)
        .selectAll<SVGRectElement, BucketChartEntry>('.liquidity-bar-above')
        .data(renderedBuckets, (d) => `${d.startTick}-${d.endTick}`)
        .join('rect')
        .attr('class', 'liquidity-bar liquidity-bar-above')
        .attr('opacity', getBarOpacity)
        .attr('x', getBarX)
        .attr('y', (d) => tickScale.tickToAxis(d.endTick))
        .attr('width', getBarWidth)
        .attr('height', (d) => calculateBucketHeight(d))
        .attr('fill', token0Color)

      // Draw bars below dotY (token1 zone)
      barsGroup
        .append('g')
        .attr('clip-path', `url(#${chartId}-bars-clip-below)`)
        .selectAll<SVGRectElement, BucketChartEntry>('.liquidity-bar-below')
        .data(renderedBuckets, (d) => `${d.startTick}-${d.endTick}`)
        .join('rect')
        .attr('class', 'liquidity-bar liquidity-bar-below')
        .attr('opacity', getBarOpacity)
        .attr('x', getBarX)
        .attr('y', (d) => tickScale.tickToAxis(d.endTick))
        .attr('width', getBarWidth)
        .attr('height', (d) => calculateBucketHeight(d))
        .attr('fill', token1Color)
    } catch (error) {
      logger.error('LiquidityBarsRenderer', {
        tags: {
          file: 'LiquidityBarsRenderer',
          function: 'draw',
        },
        extra: { error },
      })
      setChartError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return { draw }
}
