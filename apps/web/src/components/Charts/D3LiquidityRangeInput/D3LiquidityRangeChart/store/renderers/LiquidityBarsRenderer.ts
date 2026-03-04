import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import * as d3 from 'd3'
import { logger } from 'utilities/src/logger/logger'
import {
  CHART_BEHAVIOR,
  CHART_DIMENSIONS,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  ChartActions,
  ChartState,
  Renderer,
  RenderingContext,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import {
  getColorForTick,
  getOpacityForTick,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/colorUtils'
import type { BucketChartEntry } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/liquidityBucketing/liquidityBucketing'
import {
  buildBucketChartEntries,
  buildBuckets,
  buildSegmentsFromRawTicks,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/liquidityBucketing/liquidityBucketing'

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

  const draw = (): void => {
    try {
      // Clear previous bars
      barsGroup.selectAll('*').remove()

      const { colors, liquidityData, rawTicks, tickScale, tickSpacing, dimensions: contextDimensions } = context
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

      // Build segments
      const segments = buildSegmentsFromRawTicks(rawTicks)

      // If no segments were built (no liquidityNet data), nothing to render
      if (segments.length === 0) {
        return
      }

      // Calculate the VISIBLE tick range based on current zoom/pan state
      // yToTick(0) = highest visible tick (top of viewport)
      // yToTick(height) = lowest visible tick (bottom of viewport)
      const chartHeight = contextDimensions.height || CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT
      const visibleMaxTick = Math.min(tickScale.yToTick(0), nearestUsableTick(TickMath.MAX_TICK, tickSpacing)) // Top of viewport = highest visible tick
      const visibleMinTick = Math.max(tickScale.yToTick(chartHeight), nearestUsableTick(TickMath.MIN_TICK, tickSpacing)) // Bottom of viewport = lowest visible tick

      // Build buckets for VISIBLE range
      const buckets = buildBuckets({
        segments,
        visibleMinTick,
        visibleMaxTick,
        desiredBars: CHART_BEHAVIOR.DESIRED_BUCKETS,
        tickSpacing,
      })

      // Convert to chart data with segment tracking
      // Sum locked amounts from all entries within the bucket's tick range.
      // For sparse pools (few initialized ticks), a bucket may contain no entries
      // even though it overlaps a segment — fall back to segment-based lookup.
      const renderedBuckets: BucketChartEntry[] = buildBucketChartEntries({
        buckets,
        liquidityData,
        baseCurrency,
        quoteCurrency,
        priceInverted,
        protocolVersion,
      })

      // Store rendered buckets in state for overlay hover detection
      getActions().setChartState({ renderedBuckets })

      if (renderedBuckets.length === 0) {
        return
      }

      // X scale for liquidity amounts - use max from buckets with liquidity > 0
      const liquidityValues = renderedBuckets.map((d) => Number(d.liquidityActive)).filter((v) => v > 0)
      const maxLiquidity = liquidityValues.length > 0 ? Math.max(...liquidityValues) : 1
      const liquidityXScale = d3
        .scaleLinear()
        .domain([0, maxLiquidity])
        .range([0, CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET])

      // Calculate bucket height based on tick range
      // Each bucket spans [startTick, endTick], convert to Y using the linear scale
      // Subtract divider height to create 1px gap between bars
      const calculateBucketHeight = (bucket: BucketChartEntry): number => {
        const topY = tickScale.tickToY(bucket.endTick) // Higher tick -> lower Y
        const bottomY = tickScale.tickToY(bucket.startTick) // Lower tick -> higher Y
        return Math.max(2, bottomY - topY - CHART_DIMENSIONS.LIQUIDITY_BAR_SPACING)
      }

      // Draw bucket bars
      barsGroup
        .selectAll<SVGRectElement, BucketChartEntry>('.liquidity-bar')
        .data(renderedBuckets, (d) => `${d.startTick}-${d.endTick}`)
        .join('rect')
        .attr('class', 'liquidity-bar')
        .attr('opacity', (d) => {
          // Check if this bucket belongs to the hovered segment
          const isInHoveredSegment =
            hoveredSegment &&
            d.segmentStartTick === hoveredSegment.startTick &&
            d.segmentEndTick === hoveredSegment.endTick

          // If in hovered segment, use full opacity for highlighting
          if (isInHoveredSegment) {
            return 1
          }

          // Use center tick for normal opacity calculation
          const centerTick = (d.startTick + d.endTick) / 2
          return getOpacityForTick({
            tick: centerTick,
            minTick,
            maxTick,
          })
        })
        .attr('x', (d) => {
          // Calculate bar width first (0 for no liquidity, minimum 3px otherwise)
          const barWidth = d.liquidityActive <= 0 ? 0 : Math.max(3, liquidityXScale(Number(d.liquidityActive)))
          return (
            dimensions.width -
            barWidth +
            CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH -
            CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET
          )
        })
        .attr('y', (d) => {
          // Position based on the higher tick (endTick) since high ticks are at top
          return tickScale.tickToY(d.endTick)
        })
        .attr('width', (d) => {
          // 0-liquidity buckets have 0 width, others have minimum 3px
          if (d.liquidityActive <= 0) {
            return 0
          }
          return Math.max(3, liquidityXScale(Number(d.liquidityActive)))
        })
        .attr('height', (d) => calculateBucketHeight(d))
        .attr('fill', (d) => {
          const centerTick = (d.startTick + d.endTick) / 2
          return getColorForTick({
            tick: centerTick,
            minTick,
            maxTick,
            getActiveColor: () => colors.accent1.val,
            getInactiveColor: () => colors.neutral1.val,
          })
        })
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
