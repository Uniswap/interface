import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  ChartActions,
  ChartState,
  Renderer,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import * as d3 from 'd3'

const SOLID_PRICE_LINE_CLASSES = {
  MIN_LINE: 'min-price-line',
  MAX_LINE: 'max-price-line',
}

const TRANSPARENT_PRICE_LINE_CLASSES = {
  MIN_LINE: 'transparent-min-price-line',
  MAX_LINE: 'transparent-max-price-line',
}

export function createMinMaxPriceLineRenderer({
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
  const priceLineGroup = g.append('g').attr('class', 'min-max-price-line-group')

  const draw = (): void => {
    // Clear previous price line elements
    priceLineGroup.selectAll('*').remove()

    const { colors, dimensions, priceToY } = context
    const { minPrice, maxPrice } = getState()

    // Only draw if both prices are set
    if (minPrice === undefined || maxPrice === undefined) {
      return
    }

    // Get drag behaviors
    const actions = getActions()
    const minDragBehavior = actions.createHandleDragBehavior('min')
    const maxDragBehavior = actions.createHandleDragBehavior('max')

    // Draw min price line (solid)
    priceLineGroup
      .append('line')
      .attr('class', `price-range-element ${SOLID_PRICE_LINE_CLASSES.MIN_LINE}`)
      .attr('x1', 0) // Start from left margin
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET) // Extend to right edge
      .attr(
        'y1',
        priceToY({ price: minPrice, tickAlignment: 'bottom' }) + CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT / 2,
      )
      .attr(
        'y2',
        priceToY({ price: minPrice, tickAlignment: 'bottom' }) + CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT / 2,
      )
      .attr('stroke', colors.accent1.val)
      .attr('stroke-width', CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT)
      .attr('opacity', 0.08)

    // Draw max price line (solid)
    priceLineGroup
      .append('line')
      .attr('class', `price-range-element ${SOLID_PRICE_LINE_CLASSES.MAX_LINE}`)
      .attr('x1', 0) // Start from left margin
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET) // Extend to right edge
      .attr('y1', priceToY({ price: maxPrice, tickAlignment: 'top' }) - CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT / 2)
      .attr('y2', priceToY({ price: maxPrice, tickAlignment: 'top' }) - CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT / 2)
      .attr('stroke', colors.accent1.val)
      .attr('stroke-width', CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT)
      .attr('opacity', 0.08)

    // Draw min price line (transparent) with drag behavior
    priceLineGroup
      .append('line')
      .attr('class', `price-range-element ${TRANSPARENT_PRICE_LINE_CLASSES.MIN_LINE}`)
      .attr('x1', 0) // Start from left margin
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET) // Extend to right edge before liquidity section
      .attr('y1', priceToY({ price: minPrice, tickAlignment: 'bottom' }))
      .attr('y2', priceToY({ price: minPrice, tickAlignment: 'bottom' }))
      .attr('stroke', colors.accent1.val)
      .attr('stroke-width', CHART_DIMENSIONS.TRANSPARENT_MIN_MAX_LINE_HEIGHT)
      .attr('opacity', 0)
      .attr('cursor', 'ns-resize')
      .call(minDragBehavior)

    // Draw max price line (transparent) with drag behavior
    priceLineGroup
      .append('line')
      .attr('class', `price-range-element ${TRANSPARENT_PRICE_LINE_CLASSES.MAX_LINE}`)
      .attr('x1', 0) // Start from left margin
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET) // Extend to right edge before liquidity section
      .attr('y1', priceToY({ price: maxPrice, tickAlignment: 'top' }))
      .attr('y2', priceToY({ price: maxPrice, tickAlignment: 'top' }))
      .attr('stroke', colors.accent1.val)
      .attr('stroke-width', CHART_DIMENSIONS.TRANSPARENT_MIN_MAX_LINE_HEIGHT)
      .attr('opacity', 0)
      .attr('cursor', 'ns-resize')
      .call(maxDragBehavior)
  }

  return { draw }
}
