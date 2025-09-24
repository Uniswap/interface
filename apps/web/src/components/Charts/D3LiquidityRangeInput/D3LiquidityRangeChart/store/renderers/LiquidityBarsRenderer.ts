import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  ChartState,
  Renderer,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import {
  getColorForPrice,
  getOpacityForPrice,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/colorUtils'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import * as d3 from 'd3'

export function createLiquidityBarsRenderer({
  g,
  context,
  getState,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: RenderingContext
  getState: () => ChartState
}): Renderer {
  const barsGroup = g.append('g').attr('class', 'liquidity-bars-group')

  const draw = (): void => {
    // Clear previous bars
    barsGroup.selectAll('*').remove()

    const { colors, liquidityData, tickScale } = context
    const { minPrice, maxPrice, dimensions } = getState() // Get dimensions from state

    if (liquidityData.length === 0 || minPrice === undefined || maxPrice === undefined) {
      return
    }

    // X scale for liquidity amounts - use all data to maintain consistent bar scaling
    // This prevents bars from changing width when scrolling through different liquidity ranges
    const maxLiquidity = d3.max(liquidityData, (d) => d.activeLiquidity) || 0
    const liquidityXScale = d3
      .scaleLinear()
      .domain([0, maxLiquidity])
      .range([0, CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET])

    // Draw horizontal liquidity bars using data join for better performance
    const bars = barsGroup.selectAll<SVGRectElement, ChartEntry>('.liquidity-bar').data(liquidityData, (d) => d.price0)

    bars
      .enter()
      .append('rect')
      .attr('class', 'liquidity-bar')
      .attr('opacity', (d) =>
        getOpacityForPrice({
          value: d.price0,
          minPrice,
          maxPrice,
        }),
      )
      .attr(
        'x',
        (d) =>
          dimensions.width -
          liquidityXScale(d.activeLiquidity) +
          CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH -
          CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET,
      )
      .attr('y', (d) => tickScale(d.tick?.toString() ?? '') || 0)
      .attr('width', (d) => liquidityXScale(d.activeLiquidity))
      .attr('height', tickScale.bandwidth())
      .attr('fill', (d) =>
        getColorForPrice({
          value: d.price0,
          minPrice,
          maxPrice,
          getActiveColor: () => colors.accent1.val,
          getInactiveColor: () => colors.neutral1.val,
        }),
      )
  }

  return { draw }
}
