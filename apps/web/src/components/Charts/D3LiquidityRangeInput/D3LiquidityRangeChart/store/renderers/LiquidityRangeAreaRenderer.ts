import * as d3 from 'd3'
import { CHART_DIMENSIONS } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  ChartActions,
  ChartState,
  Renderer,
  RenderingContext,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'

export function createLiquidityRangeAreaRenderer({
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
  const rangeAreaGroup = g.append('g').attr('class', 'liquidity-range-area-group')

  const draw = (): void => {
    // Clear previous range area elements
    rangeAreaGroup.selectAll('*').remove()

    const { colors, dimensions, tickToY } = context
    const { minTick, maxTick, isFullRange } = getState()

    // Get drag behaviors
    const actions = getActions()
    const tickBasedDragBehavior = actions.createTickBasedDragBehavior()

    // Only draw if both prices are set
    if (minTick === undefined || maxTick === undefined) {
      return
    }

    // Draw visual pink background that extends over liquidity area (no interactions)
    rangeAreaGroup
      .append('rect')
      .attr('class', `price-range-element visual-bg`)
      .attr('x', 0)
      .attr('y', tickToY({ tick: maxTick, tickAlignment: 'top' }))
      .attr(
        'width',
        dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET,
      )
      .attr(
        'height',
        tickToY({ tick: minTick, tickAlignment: 'bottom' }) - tickToY({ tick: maxTick, tickAlignment: 'top' }),
      )
      .attr('fill', colors.accent1.val)
      .attr('opacity', 0.2)
      .attr('stroke', 'none')
      .style('pointer-events', 'none')

    if (isFullRange) {
      return
    }

    // Draw interactive pink background only over main chart area (for dragging)
    rangeAreaGroup
      .append('rect')
      .attr('class', `price-range-element interactive-bg`)
      .attr('x', 0) // Extend left to cover the margin area
      .attr('y', tickToY({ tick: maxTick, tickAlignment: 'top' }))
      .attr('width', dimensions.width) // Stop before liquidity area
      .attr(
        'height',
        tickToY({ tick: minTick, tickAlignment: 'bottom' }) - tickToY({ tick: maxTick, tickAlignment: 'top' }),
      )
      .attr('fill', 'transparent') // Invisible, just for interactions
      .attr('stroke', 'none')
      .attr('cursor', 'move')
      .call(tickBasedDragBehavior)
  }

  return { draw }
}
