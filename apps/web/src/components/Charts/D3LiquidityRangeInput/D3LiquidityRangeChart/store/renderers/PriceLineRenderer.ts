import type {
  Renderer,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getColorForPrice } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/colorUtils'
import * as d3 from 'd3'

export function createPriceLineRenderer({
  g,
  context,
  getState,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: RenderingContext
  getState: () => { minPrice: number | null; maxPrice: number | null }
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
      .y((d) => priceToY(d.value))
      .curve(d3.curveMonotoneX)

    // Draw price line with conditional coloring
    if (minPrice !== null && maxPrice !== null) {
      // Draw segments with different colors based on price range
      for (let i = 0; i < priceDataMapped.length - 1; i++) {
        const currentPoint = priceDataMapped[i]
        const nextPoint = priceDataMapped[i + 1]

        // Check if current point is within range
        const color = getColorForPrice({
          value: currentPoint.value,
          minPrice,
          maxPrice,
          getActiveColor: () => colors.accent1.val,
          getInactiveColor: () => colors.neutral2.val,
        })

        // Draw line segment between current and next point
        priceLineGroup
          .append('path')
          .datum([currentPoint, nextPoint])
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('d', line)
          .attr('class', 'price-segment')
      }
    } else {
      // Draw single grey line when no range is selected
      priceLineGroup
        .append('path')
        .datum(priceDataMapped)
        .attr('fill', 'none')
        .attr('stroke', colors.neutral2.val)
        .attr('stroke-width', 2)
        .attr('d', line)
        .attr('class', 'price-line')
    }
  }

  return { draw }
}
