import type {
  ChartState,
  Renderer,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import * as d3 from 'd3'

export function createPriceLineRenderer({
  g,
  context,
  getState,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: RenderingContext
  getState: () => ChartState
}): Renderer {
  const priceLineGroup = g.append('g').attr('class', 'price-line-group')

  const draw = (): void => {
    // Clear previous price line elements
    priceLineGroup.selectAll('*').remove()

    const { colors, dimensions, priceData, priceToY } = context
    const { minPrice, maxPrice } = getState()

    // Map price data for D3
    const priceDataMapped = priceData.map((d) => ({
      date: new Date(d.time * 1000),
      value: d.value,
    }))

    if (priceDataMapped.length === 0) {
      return
    }

    // Create scales for price line chart
    const dateExtent = d3.extent(priceDataMapped, (d) => d.date)

    const xScale = d3
      .scaleTime()
      .domain(dateExtent[0] ? dateExtent : [new Date(), new Date()])
      .range([0, dimensions.width])

    // Line generator for price
    const line = d3
      .line<{ date: Date; value: number }>()
      .x((d) => xScale(d.date))
      .y((d) => priceToY({ price: d.value }))
      .curve(d3.curveMonotoneX)

    // Generate the complete line path data
    const linePathData = line(priceDataMapped)

    // Draw price line with conditional coloring
    if (minPrice !== undefined && maxPrice !== undefined) {
      // Create mask for active range only
      const maskId = 'price-line-active-mask'
      const defs = priceLineGroup.append('defs')

      const minPriceY = priceToY({ price: minPrice })
      const maxPriceY = priceToY({ price: maxPrice })

      // Active range mask
      defs
        .append('mask')
        .attr('id', maskId)
        .append('rect')
        .attr('x', 0)
        .attr('y', maxPriceY)
        .attr('width', dimensions.width)
        .attr('height', minPriceY - maxPriceY)
        .attr('fill', 'white')

      // Draw full grey line (base layer)
      priceLineGroup
        .append('path')
        .attr('d', linePathData)
        .attr('fill', 'none')
        .attr('stroke', colors.neutral2.val)
        .attr('stroke-width', 2)

      // Draw active pink line on top (masked)
      priceLineGroup
        .append('path')
        .attr('d', linePathData)
        .attr('fill', 'none')
        .attr('stroke', colors.accent1.val)
        .attr('stroke-width', 2)
        .attr('mask', `url(#${maskId})`)
    } else {
      // Draw single grey line when no range is selected
      priceLineGroup
        .append('path')
        .attr('d', linePathData)
        .attr('fill', 'none')
        .attr('stroke', colors.neutral2.val)
        .attr('stroke-width', 2)
        .attr('class', 'price-line')
    }
  }

  return { draw }
}
