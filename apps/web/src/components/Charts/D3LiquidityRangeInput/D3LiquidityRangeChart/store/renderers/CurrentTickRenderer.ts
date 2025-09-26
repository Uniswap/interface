import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  ChartState,
  Renderer,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getColorForPrice } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/colorUtils'
import * as d3 from 'd3'

const CURRENT_PRICE_CLASSES = {
  LINE: 'current-price-line',
  LABEL: 'current-price-label',
  DOT: 'current-price-dot',
}

export function createCurrentTickRenderer({
  g,
  context,
  getState,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: RenderingContext
  getState: () => ChartState
}): Renderer {
  const currentTickGroup = g.append('g').attr('class', 'current-tick-group')

  const draw = (): void => {
    // Clear previous current tick elements
    currentTickGroup.selectAll('*').remove()

    const { colors, dimensions, priceData, priceToY } = context
    const { minPrice, maxPrice } = getState()

    // Get current price from the latest data point
    const currentPriceData = priceData[priceData.length - 1]

    const currentPrice = currentPriceData.value

    // Draw dotted line across the entire chart for current price
    currentTickGroup
      .append('line')
      .attr('class', CURRENT_PRICE_CLASSES.LINE)
      .attr('x1', 0) // Start from left edge
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET) // Extend to right edge
      .attr('y1', priceToY({ price: currentPrice }))
      .attr('y2', priceToY({ price: currentPrice }))
      .attr('stroke', colors.neutral2.val)
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', '0,6') // Dotted line pattern
      .attr('opacity', 0.8)

    // Draw a circle at the current price position on the price line
    const dotColor = getColorForPrice({
      value: currentPrice,
      minPrice,
      maxPrice,
      getActiveColor: () => colors.accent1.val,
      getInactiveColor: () => colors.neutral2.val,
    })

    currentTickGroup
      .append('circle')
      .attr('class', CURRENT_PRICE_CLASSES.DOT)
      .attr('cx', dimensions.width)
      .attr('cy', priceToY({ price: currentPrice }))
      .attr('r', CHART_DIMENSIONS.PRICE_DOT_RADIUS)
      .attr('fill', dotColor)
      .attr('opacity', 1)
  }

  return {
    draw,
  }
}
