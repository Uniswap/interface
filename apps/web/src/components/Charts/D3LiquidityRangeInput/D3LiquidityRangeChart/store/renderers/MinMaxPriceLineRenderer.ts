import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  Renderer,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import * as d3 from 'd3'

const SOLID_PRICE_LINE_CLASSES = {
  MIN_LINE: 'min-price-line',
  MAX_LINE: 'max-price-line',
}

export function createMinMaxPriceLineRenderer({
  g,
  context,
  getState,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: RenderingContext
  getState: () => { minPrice: number | null; maxPrice: number | null }
}): Renderer {
  const priceLineGroup = g.append('g').attr('class', 'min-max-price-line-group')

  const draw = (): void => {
    // Clear previous price line elements
    priceLineGroup.selectAll('*').remove()

    const { colors, dimensions, priceToY } = context
    const { minPrice, maxPrice } = getState()

    // Only draw if both prices are set
    if (minPrice === null || maxPrice === null) {
      return
    }

    // Draw min price line (solid)
    priceLineGroup
      .append('line')
      .attr('class', `price-range-element ${SOLID_PRICE_LINE_CLASSES.MIN_LINE}`)
      .attr('x1', 0) // Start from left margin
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH) // Extend to right edge
      .attr('y1', priceToY(minPrice) + CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT / 2)
      .attr('y2', priceToY(minPrice) + CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT / 2)
      .attr('stroke', colors.accent1.val)
      .attr('stroke-width', CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT)
      .attr('opacity', 0.08)

    // Draw max price line (solid)
    priceLineGroup
      .append('line')
      .attr('class', `price-range-element ${SOLID_PRICE_LINE_CLASSES.MAX_LINE}`)
      .attr('x1', 0) // Start from left margin
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH) // Extend to right edge
      .attr('y1', priceToY(maxPrice) - CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT / 2)
      .attr('y2', priceToY(maxPrice) - CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT / 2)
      .attr('stroke', colors.accent1.val)
      .attr('stroke-width', CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT)
      .attr('opacity', 0.08)
  }

  return { draw }
}
