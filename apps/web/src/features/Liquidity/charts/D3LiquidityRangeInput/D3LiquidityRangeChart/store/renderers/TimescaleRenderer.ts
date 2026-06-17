import * as d3 from 'd3'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import type {
  Renderer,
  RenderingContext,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getTimeFormat } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/timeUtils'

export function createTimescaleRenderer({
  g,
  context,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: RenderingContext
}): Renderer {
  const timescaleGroup = g.append('g').attr('class', 'timescale-group')

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
    const dateDomain: [Date, Date] = dateExtent[0] ? dateExtent : [new Date(), new Date()]

    const xScale = d3
      .scaleTime()
      .domain(dateDomain)
      // Start HEIGHT from the left of the chart for padding
      .range([CHART_DIMENSIONS.TIMESCALE_HEIGHT, dimensions.width])

    const timeFormat = getTimeFormat(dateDomain)

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
