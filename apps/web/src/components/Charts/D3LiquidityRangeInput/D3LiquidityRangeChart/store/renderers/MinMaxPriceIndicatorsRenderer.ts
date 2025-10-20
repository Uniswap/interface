import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  ChartActions,
  ChartState,
  Renderer,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import * as d3 from 'd3'

const BACKGROUND_CLASSES = {
  RANGE_INDICATOR: 'range-indicator',
  VISUAL_BG: 'visual-bg',
  INTERACTIVE_BG: 'interactive-bg',
}

const DRAG_HANDLE_CLASSES = {
  MIN_HANDLE: 'min-handle',
  MAX_HANDLE: 'max-handle',
  CENTER_HANDLE: 'center-handle',
  CENTER_LINES: 'center-lines',
}

export function createMinMaxPriceIndicatorsRenderer({
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
  const minMaxPriceIndicatorsGroup = g.append('g').attr('class', 'min-max-price-indicators-group')

  const draw = (): void => {
    const { colors, dimensions, priceToY } = context
    const { minPrice, maxPrice, isFullRange } = getState()

    if (minPrice === undefined || maxPrice === undefined) {
      return
    }

    // Get drag behaviors
    const actions = getActions()
    const minDragBehavior = actions.createHandleDragBehavior('min')
    const maxDragBehavior = actions.createHandleDragBehavior('max')
    const tickBasedDragBehavior = actions.createTickBasedDragBehavior()

    // Draw price range visualization directly in the main chart
    // Remove existing range elements
    minMaxPriceIndicatorsGroup.selectAll('*').remove()

    // Check if handles are outside the visible viewport
    const isPastMaxHandle = priceToY({ price: maxPrice, tickAlignment: 'top' }) < 0
    const isPastMinHandle = priceToY({ price: minPrice, tickAlignment: 'bottom' }) > dimensions.height

    // Check if the range is partially visible (use white) vs completely out of view (use pink)
    const isRangePartiallyVisible =
      priceToY({ price: maxPrice, tickAlignment: 'top' }) < dimensions.height &&
      priceToY({ price: minPrice, tickAlignment: 'bottom' }) > 0
    const iconColor = isRangePartiallyVisible ? colors.white.val : colors.accent1.val

    // Draw dynamic range indicator line inside the border grey line
    minMaxPriceIndicatorsGroup
      .append('rect')
      .attr('class', `price-range-element ${BACKGROUND_CLASSES.RANGE_INDICATOR}`)
      .attr('x', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET)
      .attr('y', 0)
      .attr('width', CHART_DIMENSIONS.RANGE_INDICATOR_WIDTH)
      .attr('height', dimensions.height)
      .attr('fill', colors.accent1.val)
      .attr('rx', 4)
      .attr('ry', 4)

    if (isFullRange) {
      return
    }

    // Calculate range positions with minimum height constraint
    const maxY = priceToY({ price: maxPrice, tickAlignment: 'top' })
    const minY = priceToY({ price: minPrice, tickAlignment: 'bottom' })
    const indicatorHeight = minY - maxY

    // Ensure minimum height for visual indicator
    const constrainedHeight = Math.max(indicatorHeight, CHART_DIMENSIONS.RANGE_INDICATOR_MIN_HEIGHT)
    const heightDiff = constrainedHeight - indicatorHeight

    // If we need to expand, center the expansion
    const constrainedMaxY = maxY - heightDiff / 2
    const constrainedMinY = minY + heightDiff / 2

    minMaxPriceIndicatorsGroup
      .selectAll(`.${BACKGROUND_CLASSES.RANGE_INDICATOR}`)
      .attr('y', constrainedMaxY)
      .attr('height', constrainedHeight)
      .attr('cursor', 'move')
      .attr('rx', 8)
      .attr('ry', 8)
      .call(tickBasedDragBehavior)

    // Add max price indicator - show fast-forward icon if scrolled past, otherwise show drag handle
    if (isPastMaxHandle) {
      // Show fast-forward icon when scrolled past max handle
      const arrowGroup = minMaxPriceIndicatorsGroup
        .append('g')
        .attr('class', 'arrow-group')
        .attr(
          'transform',
          `translate(${dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.RANGE_INDICATOR_WIDTH / 2 - 1}, 10)`,
        )
        .attr('cursor', 'pointer')
        .on('click', actions.centerRange)

      // Fast-forward icon path
      arrowGroup
        .append('path')
        .attr(
          'd',
          'M-3 -4.875L3 -4.875C3.207 -4.875 3.375 -4.707 3.375 -4.5C3.375 -4.293 3.207 -4.125 3 -4.125L0.77295 -4.125L2.78955 -1.57202C3.29355 -0.93402 2.83555 0 2.01855 0L0.00952 0C0.29402 0.0025 0.577 0.127 0.771 0.3725L2.78955 2.92798C3.29355 3.56598 2.83555 4.5 2.01855 4.5L-2.01855 4.5C-2.83555 4.5 -3.29355 3.56648 -2.78955 2.92798L-0.77148 0.3725C-0.57748 0.127 -0.29353 0.0025 -0.00903 0L-2.01855 0C-2.83555 0 -3.29355 -0.93352 -2.78955 -1.57202L-0.77295 -4.125L-3 -4.125C-3.207 -4.125 -3.375 -4.293 -3.375 -4.5C-3.375 -4.707 -3.207 -4.875 -3 -4.875Z',
        )
        .attr('fill', iconColor)
        .attr('opacity', 0.65)
    } else {
      // Show normal drag handle when not scrolled past
      minMaxPriceIndicatorsGroup
        .append('circle')
        .attr('class', `price-range-element ${DRAG_HANDLE_CLASSES.MAX_HANDLE}`)
        .attr(
          'cx',
          dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.RANGE_INDICATOR_WIDTH / 2 - 1,
        )
        .attr('cy', constrainedMaxY + 8)
        .attr('r', 6)
        .attr('fill', 'white')
        .attr('stroke', 'rgba(0,0,0,0.1)')
        .attr('stroke-width', 1)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
        .attr('cursor', 'ns-resize')
        .call(maxDragBehavior)
    }

    // Add min price indicator - show fast-backward icon if scrolled past, otherwise show drag handle
    if (isPastMinHandle) {
      // Show fast-backward icon when scrolled past min handle
      const arrowGroup = minMaxPriceIndicatorsGroup
        .append('g')
        .attr('class', 'arrow-group')
        .attr(
          'transform',
          `translate(${dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.RANGE_INDICATOR_WIDTH / 2 - 1}, ${dimensions.height - 10})`,
        )
        .attr('cursor', 'pointer')
        .on('click', actions.centerRange)

      // Fast-backward icon path
      arrowGroup
        .append('path')
        .attr(
          'd',
          'M-3 4.875L3 4.875C3.207 4.875 3.375 4.707 3.375 4.5C3.375 4.293 3.207 4.125 3 4.125L0.77295 4.125L2.78955 1.57202C3.29355 0.93402 2.83555 0 2.01855 0L0.00952 0C0.29402 -0.0025 0.577 -0.127 0.771 -0.3725L2.78955 -2.92798C3.29355 -3.56598 2.83555 -4.5 2.01855 -4.5L-2.01855 -4.5C-2.83555 -4.5 -3.29355 -3.56648 -2.78955 -2.92798L-0.77148 -0.3725C-0.57748 -0.127 -0.29353 -0.0025 -0.00903 0L-2.01855 0C-2.83555 0 -3.29355 0.93352 -2.78955 1.57202L-0.77295 4.125L -3 4.125C-3.207 4.125 -3.375 4.293 -3.375 4.5C-3.375 4.707 -3.207 4.875 -3 4.875Z',
        )
        .attr('fill', iconColor)
        .attr('opacity', 0.65)
    } else {
      // Show normal drag handle when not scrolled past
      minMaxPriceIndicatorsGroup
        .append('circle')
        .attr('class', `price-range-element ${DRAG_HANDLE_CLASSES.MIN_HANDLE}`)
        .attr(
          'cx',
          dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.RANGE_INDICATOR_WIDTH / 2 - 1,
        )
        .attr('cy', constrainedMinY - 8)
        .attr('r', 6)
        .attr('fill', 'white')
        .attr('stroke', 'rgba(0,0,0,0.1)')
        .attr('stroke-width', 1)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
        .attr('cursor', 'ns-resize')
        .call(minDragBehavior)
    }

    // Add center drag indicator for moving entire range
    const centerY = (constrainedMaxY + constrainedMinY) / 2
    minMaxPriceIndicatorsGroup
      .append('rect')
      .attr('class', `price-range-element ${DRAG_HANDLE_CLASSES.CENTER_HANDLE}`)
      .attr(
        'x',
        dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.RANGE_INDICATOR_WIDTH / 2 - 1 - 6,
      ) // Center the 12px width
      .attr('y', centerY - 3) // Center the 6px height
      .attr('width', 12)
      .attr('height', 6)
      .attr('fill', 'white')
      .attr('stroke', 'rgba(0,0,0,0.1)')
      .attr('stroke-width', 1)
      .attr('rx', 2)
      .attr('ry', 2)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .attr('cursor', 'move')
      .call(tickBasedDragBehavior)

    // Add 3 grey lines inside the center drag indicator
    const centerIndicatorX =
      dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.RANGE_INDICATOR_WIDTH / 2 - 1
    for (let i = 0; i < 3; i++) {
      minMaxPriceIndicatorsGroup
        .append('rect')
        .attr('class', `price-range-element ${DRAG_HANDLE_CLASSES.CENTER_LINES}`)
        .attr('x', centerIndicatorX - 1.75 + i * 1.25) // Space the 3 lines evenly within 12px width
        .attr('y', centerY - 1.5) // Center the 3px height within 6px indicator
        .attr('width', 0.5)
        .attr('height', 3)
        .attr('fill', 'rgba(0,0,0,0.3)')
        .style('pointer-events', 'none') // Don't interfere with drag events
    }
  }

  return { draw }
}
