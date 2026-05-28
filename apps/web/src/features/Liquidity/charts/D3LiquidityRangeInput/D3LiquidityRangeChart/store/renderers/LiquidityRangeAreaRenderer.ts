import * as d3 from 'd3'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import type {
  ChartActions,
  ChartState,
  Renderer,
  RenderingContext,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getCurrentTickDotY } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickToY'

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

    const { dimensions, tickToY, currentTick, token0Color, token1Color } = context
    const { minTick, maxTick, isFullRange } = getState()

    // Get drag behaviors
    const actions = getActions()
    const tickBasedDragBehavior = actions.createTickBasedDragBehavior()

    // Only draw if both prices are set
    if (minTick === undefined || maxTick === undefined) {
      return
    }

    const rangeTopY = tickToY({ tick: maxTick, tickAlignment: 'top' })
    const rangeBottomY = tickToY({ tick: minTick, tickAlignment: 'bottom' })
    const rangeWidth =
      dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET

    const { renderedBuckets } = getState()
    const { tickScale } = context
    const dotY = getCurrentTickDotY({ currentTick, renderedBuckets, tickScale })

    if (rangeTopY >= dotY && rangeBottomY >= dotY) {
      // Entirely below the dot → token1Color
      rangeAreaGroup
        .append('rect')
        .attr('class', 'price-range-element visual-bg')
        .attr('x', 0)
        .attr('y', rangeTopY)
        .attr('width', rangeWidth)
        .attr('height', rangeBottomY - rangeTopY)
        .attr('fill', token1Color)
        .attr('opacity', 0.2)
        .attr('stroke', 'none')
        .style('pointer-events', 'none')
    } else if (rangeBottomY <= dotY) {
      // Entirely above the dot → token0Color
      rangeAreaGroup
        .append('rect')
        .attr('class', 'price-range-element visual-bg')
        .attr('x', 0)
        .attr('y', rangeTopY)
        .attr('width', rangeWidth)
        .attr('height', rangeBottomY - rangeTopY)
        .attr('fill', token0Color)
        .attr('opacity', 0.2)
        .attr('stroke', 'none')
        .style('pointer-events', 'none')
    } else {
      // Spans the dot → split at dotY
      // Token0 portion (above dot)
      rangeAreaGroup
        .append('rect')
        .attr('class', 'price-range-element visual-bg')
        .attr('x', 0)
        .attr('y', rangeTopY)
        .attr('width', rangeWidth)
        .attr('height', dotY - rangeTopY)
        .attr('fill', token0Color)
        .attr('opacity', 0.2)
        .attr('stroke', 'none')
        .style('pointer-events', 'none')

      // Token1 portion (below dot)
      rangeAreaGroup
        .append('rect')
        .attr('class', 'price-range-element visual-bg')
        .attr('x', 0)
        .attr('y', dotY)
        .attr('width', rangeWidth)
        .attr('height', rangeBottomY - dotY)
        .attr('fill', token1Color)
        .attr('opacity', 0.2)
        .attr('stroke', 'none')
        .style('pointer-events', 'none')
    }

    if (isFullRange) {
      return
    }

    // Draw interactive background only over main chart area (for dragging)
    rangeAreaGroup
      .append('rect')
      .attr('class', 'price-range-element interactive-bg')
      .attr('x', 0)
      .attr('y', rangeTopY)
      .attr('width', dimensions.width)
      .attr('height', rangeBottomY - rangeTopY)
      .attr('fill', 'transparent')
      .attr('stroke', 'none')
      .attr('cursor', 'move')
      .call(tickBasedDragBehavior)
  }

  return { draw }
}
