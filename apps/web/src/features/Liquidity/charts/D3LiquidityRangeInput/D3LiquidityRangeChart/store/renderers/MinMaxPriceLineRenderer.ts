import type * as d3 from 'd3'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import { getColorForTick } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/colorUtils'
import type {
  ChartActions,
  ChartState,
  Renderer,
  RenderingContext,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'

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

    const { dimensions, tickToY, currentTick, token0Color, token1Color } = context
    const { minTick, maxTick } = getState()

    // Only draw if both prices are set
    if (minTick === undefined || maxTick === undefined) {
      return
    }

    // Get drag behaviors
    const actions = getActions()
    const minDragBehavior = actions.createHandleDragBehavior('min')
    const maxDragBehavior = actions.createHandleDragBehavior('max')

    // Determine colors based on tick position relative to currentTick
    const minLineColor =
      getColorForTick({
        tick: minTick,
        currentTick,
        token0Color,
        token1Color,
      }) ?? token1Color
    const maxLineColor =
      getColorForTick({
        tick: maxTick,
        currentTick,
        token0Color,
        token1Color,
      }) ?? token0Color

    // Draw min price line (solid)
    priceLineGroup
      .append('line')
      .attr('class', `price-range-element ${SOLID_PRICE_LINE_CLASSES.MIN_LINE}`)
      .attr('x1', 0)
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET)
      .attr('y1', tickToY({ tick: minTick, tickAlignment: 'bottom' }) + CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT / 2)
      .attr('y2', tickToY({ tick: minTick, tickAlignment: 'bottom' }) + CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT / 2)
      .attr('stroke', minLineColor)
      .attr('stroke-width', CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT)
      .attr('opacity', 0.08)

    // Draw max price line (solid)
    priceLineGroup
      .append('line')
      .attr('class', `price-range-element ${SOLID_PRICE_LINE_CLASSES.MAX_LINE}`)
      .attr('x1', 0)
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET)
      .attr('y1', tickToY({ tick: maxTick, tickAlignment: 'top' }) - CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT / 2)
      .attr('y2', tickToY({ tick: maxTick, tickAlignment: 'top' }) - CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT / 2)
      .attr('stroke', maxLineColor)
      .attr('stroke-width', CHART_DIMENSIONS.SOLID_MIN_MAX_LINE_HEIGHT)
      .attr('opacity', 0.08)

    // Draw min price line (transparent) with drag behavior
    priceLineGroup
      .append('line')
      .attr('class', `price-range-element ${TRANSPARENT_PRICE_LINE_CLASSES.MIN_LINE}`)
      .attr('x1', 0)
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET)
      .attr('y1', tickToY({ tick: minTick, tickAlignment: 'bottom' }))
      .attr('y2', tickToY({ tick: minTick, tickAlignment: 'bottom' }))
      .attr('stroke', minLineColor)
      .attr('stroke-width', CHART_DIMENSIONS.TRANSPARENT_MIN_MAX_LINE_HEIGHT)
      .attr('opacity', 0)
      .attr('cursor', 'ns-resize')
      .call(minDragBehavior)

    // Draw max price line (transparent) with drag behavior
    priceLineGroup
      .append('line')
      .attr('class', `price-range-element ${TRANSPARENT_PRICE_LINE_CLASSES.MAX_LINE}`)
      .attr('x1', 0)
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET)
      .attr('y1', tickToY({ tick: maxTick, tickAlignment: 'top' }))
      .attr('y2', tickToY({ tick: maxTick, tickAlignment: 'top' }))
      .attr('stroke', maxLineColor)
      .attr('stroke-width', CHART_DIMENSIONS.TRANSPARENT_MIN_MAX_LINE_HEIGHT)
      .attr('opacity', 0)
      .attr('cursor', 'ns-resize')
      .call(maxDragBehavior)
  }

  return { draw }
}
