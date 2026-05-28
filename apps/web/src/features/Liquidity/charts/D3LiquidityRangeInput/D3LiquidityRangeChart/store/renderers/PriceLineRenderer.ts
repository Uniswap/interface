import * as d3 from 'd3'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import type {
  ChartState,
  Renderer,
  RenderingContext,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getCurrentTickDotY } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickToY'

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

    const {
      chartId,
      colors,
      dimensions,
      priceData,
      priceToY,
      tickToY,
      currentTick,
      token0Color,
      token1Color,
      tickScale,
    } = context
    const { minTick, maxTick, renderedBuckets } = getState()
    const neutralColor = colors.neutral2.val

    const chartHeight = dimensions.height || CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT

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

    const dotY = getCurrentTickDotY({ currentTick, renderedBuckets, tickScale })

    // Range boundary Y positions — match the visible range overlay (top of the
    // bucket at maxTick, bottom of the bucket at minTick).
    const maxY =
      minTick !== undefined && maxTick !== undefined
        ? tickToY({ tick: Math.max(minTick, maxTick), tickAlignment: 'top' })
        : 0
    const minY =
      minTick !== undefined && maxTick !== undefined
        ? tickToY({ tick: Math.min(minTick, maxTick), tickAlignment: 'bottom' })
        : chartHeight

    // Generate path data
    const linePathData = line(priceDataMapped)

    // Define clip paths and gradients
    const defs = priceLineGroup.append('defs')

    // Clip: in-range + above dotY (token0 zone)
    defs
      .append('clipPath')
      .attr('id', `${chartId}-clip-in-range-above`)
      .append('rect')
      .attr('x', 0)
      .attr('y', maxY)
      .attr('width', dimensions.width)
      .attr('height', Math.max(0, dotY - maxY))

    // Clip: in-range + below dotY (token1 zone)
    defs
      .append('clipPath')
      .attr('id', `${chartId}-clip-in-range-below`)
      .append('rect')
      .attr('x', 0)
      .attr('y', dotY)
      .attr('width', dimensions.width)
      .attr('height', Math.max(0, minY - dotY))

    // Clip: out-of-range above maxTick
    defs
      .append('clipPath')
      .attr('id', `${chartId}-clip-out-above`)
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', dimensions.width)
      .attr('height', Math.max(0, maxY))

    // Clip: out-of-range below minTick
    defs
      .append('clipPath')
      .attr('id', `${chartId}-clip-out-below`)
      .append('rect')
      .attr('x', 0)
      .attr('y', minY)
      .attr('width', dimensions.width)
      .attr('height', Math.max(0, chartHeight - minY))

    // Draw token-colored price line (within range)
    priceLineGroup
      .append('path')
      .attr('d', linePathData)
      .attr('fill', 'none')
      .attr('stroke', token0Color)
      .attr('stroke-width', 2)
      .attr('clip-path', `url(#${chartId}-clip-in-range-above)`)

    priceLineGroup
      .append('path')
      .attr('d', linePathData)
      .attr('fill', 'none')
      .attr('stroke', token1Color)
      .attr('stroke-width', 2)
      .attr('clip-path', `url(#${chartId}-clip-in-range-below)`)

    // Draw neutral price line (outside range)
    priceLineGroup
      .append('path')
      .attr('d', linePathData)
      .attr('fill', 'none')
      .attr('stroke', neutralColor)
      .attr('stroke-width', 2)
      .attr('clip-path', `url(#${chartId}-clip-out-above)`)

    priceLineGroup
      .append('path')
      .attr('d', linePathData)
      .attr('fill', 'none')
      .attr('stroke', neutralColor)
      .attr('stroke-width', 2)
      .attr('clip-path', `url(#${chartId}-clip-out-below)`)
  }

  return { draw }
}
