import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  ChartState,
  Renderer,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getTimeFormat } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/timeUtils'
import * as d3 from 'd3'

export function createTimescaleRenderer({
  g,
  context,
  getState,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: RenderingContext
  getState: () => ChartState
}): Renderer {
  const timescaleGroup = g.append('g').attr('class', 'timescale-group')
  const { selectedHistoryDuration } = getState()

  const draw = (): void => {
    // Clear previous timescale elements
    timescaleGroup.selectAll('*').remove()

    const { colors, dimensions, priceData } = context

    if (priceData.length === 0) {
      return
    }

    const priceDataMapped = priceData.map((d) => ({
      date: new Date(d.time * 1000),
      value: d.value,
    }))

    // Create time scale for the x-axis
    const dateExtent = d3.extent(priceDataMapped, (d) => d.date)

    const xScale = d3
      .scaleTime()
      .domain(dateExtent[0] ? dateExtent : [new Date(), new Date()])
      // Start HEIGHT from the left of the chart for padding
      .range([CHART_DIMENSIONS.TIMESCALE_HEIGHT, dimensions.width])

    const timeFormat = getTimeFormat(selectedHistoryDuration)

    const ticks = xScale.ticks(4)

    timescaleGroup
      .selectAll('.time-label')
      .data(ticks)
      .enter()
      .append('text')
      .attr('class', 'time-label')
      .attr('x', (d) => xScale(d))
      .attr('y', CHART_DIMENSIONS.TIMESCALE_HEIGHT / 2 + 4)
      .attr('text-anchor', 'middle')
      .style('fill', colors.neutral2.val)
      .style('font-size', '12px')
      .text((d) => timeFormat(d))
  }

  return { draw }
}
