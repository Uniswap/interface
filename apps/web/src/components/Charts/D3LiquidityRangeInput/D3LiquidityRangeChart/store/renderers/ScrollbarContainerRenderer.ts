import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  Renderer,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import * as d3 from 'd3'

export function createScrollbarContainerRenderer({
  g,
  context,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: RenderingContext
}): Renderer {
  const scrollbarContainerGroup = g.append('g').attr('class', 'scrollbar-container-group')

  const draw = (): void => {
    // Clear previous scrollbar container elements
    scrollbarContainerGroup.selectAll('*').remove()

    const { dimensions, colors } = context

    scrollbarContainerGroup
      .append('rect')
      .attr('class', 'right-side-line')
      .attr('x', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET)
      .attr('y', 0)
      .attr('width', CHART_DIMENSIONS.RANGE_INDICATOR_WIDTH)
      .attr('height', dimensions.height)
      .attr('fill', colors.surface3.val)
      .attr('rx', 4)
      .attr('ry', 4)
  }

  return { draw }
}
