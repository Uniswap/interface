import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import * as d3 from 'd3'
import { logger } from 'utilities/src/logger/logger'
import { CHART_BEHAVIOR, CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import { getOpacityForTick } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/colorUtils'
import type { BucketChartEntry } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'
import {
  buildBucketChartEntries,
  buildBuckets,
  buildSegmentsFromRawTicks,
} from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'
import type {
  ChartActions,
  ChartState,
  Renderer,
  RenderingContext,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getCurrentTickDotY } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickToY'

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

      const {
        chartId,
        liquidityData,
        token0Color,
        token1Color,
        rawTicks,
        tickScale,
        currentTick,
        tickSpacing,
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
      const visibleMaxTick = Math.min(tickScale.axisToTick(0), nearestUsableTick(TickMath.MAX_TICK, tickSpacing)) // Top of viewport = highest visible tick
      const visibleMinTick = Math.max(
        tickScale.axisToTick(chartHeight),
        nearestUsableTick(TickMath.MIN_TICK, tickSpacing),
      ) // Bottom of viewport = lowest visible tick

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

      const getBarX = (d: BucketChartEntry): number => {
        const barWidth = Math.max(3, liquidityXScale(Number(d.liquidityActive)))
        return (
          dimensions.width -
          barWidth +
          CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH -
          CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET
        )
      }

      const getBarWidth = (d: BucketChartEntry): number => {
        return Math.max(3, liquidityXScale(Number(d.liquidityActive)))
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
