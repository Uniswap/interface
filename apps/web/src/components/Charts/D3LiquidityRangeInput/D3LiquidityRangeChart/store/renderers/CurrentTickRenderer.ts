import { CHART_DIMENSIONS } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  ChartState,
  Renderer,
  RenderingContext,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getColorForTick } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/colorUtils'

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

  const draw = (): void => {
    // Clear previous current tick elements
    currentTickGroup.selectAll('*').remove()

    const { colors, dimensions, tickToY, currentTick } = context
    const { minTick, maxTick, renderedBuckets } = getState()
    // Find the bucket containing the current tick and center the line within it
    const currentBucket = renderedBuckets?.find((b) => currentTick >= b.startTick && currentTick < b.endTick)
    const centerY = currentBucket
      ? (tickToY({ tick: currentBucket.startTick }) + tickToY({ tick: currentBucket.endTick })) / 2
      : tickToY({ tick: currentTick })

    // Draw dotted line across the entire chart for current price
    currentTickGroup
      .append('line')
      .attr('class', CURRENT_PRICE_CLASSES.LINE)
      .attr('x1', 0) // Start from left edge
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET) // Extend to right edge
      .attr('y1', centerY)
      .attr('y2', centerY)
      .attr('stroke', colors.neutral2.val)
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', '0,6') // Dotted line pattern
      .attr('opacity', 0.8)

    // Draw a circle at the current price position on the price line
    const dotColor = getColorForTick({
      tick: currentTick,
      minTick,
      maxTick,
      getActiveColor: () => colors.accent1.val,
      getInactiveColor: () => colors.neutral2.val,
    })

    currentTickGroup
      .append('circle')
      .attr('class', CURRENT_PRICE_CLASSES.DOT)
      .attr('cx', dimensions.width)
      .attr('cy', centerY)
      .attr('r', CHART_DIMENSIONS.PRICE_DOT_RADIUS)
      .attr('fill', dotColor)
      .attr('opacity', 1)
  }

  return {
    draw,
  }
}
