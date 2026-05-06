import * as d3 from 'd3'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import type {
  ChartState,
  Renderer,
  RenderingContext,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getCurrentTickDotY } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickToY'
import { findClosestPriceDataPoint } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/timeUtils'

const CURRENT_PRICE_CLASSES = {
  LINE: 'current-price-line',
  LABEL: 'current-price-label',
  DOT: 'current-price-dot',
}

export function createCurrentTickRenderer({
  g,
  context,
  getState,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: RenderingContext
  getState: () => ChartState
}): Renderer {
  const currentTickGroup = g.append('g').attr('class', 'current-tick-group')

  let currentDot: d3.Selection<SVGCircleElement, unknown, null, undefined> | null = null
  let defaultY = 0

  const draw = (): void => {
    currentTickGroup.selectAll('*').remove()
    currentDot = null

    const { chartId, colors, dimensions, currentTick, tickScale } = context
    const { renderedBuckets } = getState()
    const centerY = getCurrentTickDotY({ currentTick, renderedBuckets, tickScale })
    defaultY = centerY

    currentTickGroup
      .append('line')
      .attr('class', CURRENT_PRICE_CLASSES.LINE)
      .attr('x1', 0)
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET)
      .attr('y1', centerY)
      .attr('y2', centerY)
      .attr('stroke', colors.neutral2.val)
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', '0,6')
      .attr('opacity', 0.8)

    const defs = currentTickGroup.append('defs')
    const grad = defs
      .append('linearGradient')
      .attr('id', `${chartId}-current-tick-dot-gradient`)
      .attr('x1', '0')
      .attr('x2', '0')
      .attr('y1', '0')
      .attr('y2', '1')
    grad.append('stop').attr('offset', '0%').attr('stop-color', context.token0Color)
    grad.append('stop').attr('offset', '100%').attr('stop-color', context.token1Color)

    currentDot = currentTickGroup
      .append('circle')
      .attr('class', CURRENT_PRICE_CLASSES.DOT)
      .attr('cx', dimensions.width)
      .attr('cy', centerY)
      .attr('r', CHART_DIMENSIONS.PRICE_DOT_RADIUS)
      .attr('fill', `url(#${chartId}-current-tick-dot-gradient)`)
      .attr('opacity', 1)

    // Invisible overlay over the price chart area to track mouse for dot movement
    currentTickGroup
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('fill', 'transparent')
      .on('mousemove', function (event) {
        if (!currentDot) return
        const { dragStartY } = getState()
        if (dragStartY !== null) return

        const { priceData, priceToY } = context
        const [x] = d3.pointer(event)
        const closest = findClosestPriceDataPoint({ priceData, mouseX: x, chartWidth: dimensions.width })
        if (!closest) return

        const firstMs = priceData[0].time * 1000
        const lastMs = priceData[priceData.length - 1].time * 1000
        const totalMs = lastMs - firstMs
        const snappedX = totalMs === 0 ? 0 : ((closest.time * 1000 - firstMs) / totalMs) * dimensions.width
        currentDot.attr('cx', snappedX).attr('cy', priceToY({ price: closest.value }))
      })
      .on('mouseleave', function () {
        currentDot?.attr('cx', dimensions.width).attr('cy', defaultY)
      })
  }

  return { draw }
}
