import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  Renderer,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import * as d3 from 'd3'

export function createLiquidityRangeAreaRenderer({
  g,
  context,
  getState,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: RenderingContext
  getState: () => { minPrice: number | null; maxPrice: number | null }
}): Renderer {
  const rangeAreaGroup = g.append('g').attr('class', 'liquidity-range-area-group')

  const draw = (): void => {
    // Clear previous range area elements
    rangeAreaGroup.selectAll('*').remove()

    const { colors, dimensions, priceToY } = context
    const { minPrice, maxPrice } = getState()

    // Only draw if both prices are set
    if (minPrice === null || maxPrice === null) {
      return
    }

    // Draw visual pink background that extends over liquidity area (no interactions)
    rangeAreaGroup
      .append('rect')
      .attr('class', `price-range-element visual-bg`)
      .attr('x', 0)
      .attr('y', priceToY(maxPrice))
      .attr('width', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH) // Cover the entire SVG width
      .attr('height', priceToY(minPrice) - priceToY(maxPrice))
      .attr('fill', colors.accent1.val)
      .attr('opacity', 0.2)
      .attr('stroke', 'none')
      .style('pointer-events', 'none') // No interactions on this visual layer
  }

  return { draw }
}
