import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  ChartActions,
  ChartState,
  Renderer,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import * as d3 from 'd3'

export function createLiquidityBarsOverlayRenderer({
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
  let liquidityOverlay: d3.Selection<SVGRectElement, unknown, null, undefined> | null = null

  const draw = (): void => {
    // Clear previous overlay
    if (liquidityOverlay) {
      liquidityOverlay.remove()
    }

    const { priceData, liquidityData, yToPrice } = context
    const { dimensions, isFullRange } = getState()
    const { setChartState, handlePriceChange } = getActions()

    if (liquidityData.length === 0) {
      return
    }

    // Calculate overlay positioning
    const liquidityWidth = CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET

    // Add invisible overlay for better hover detection across the entire liquidity area
    liquidityOverlay = g
      .append('rect')
      .attr('class', 'liquidity-overlay')
      .attr('x', dimensions.width)
      .attr('y', 0)
      .attr('width', liquidityWidth)
      .attr('height', dimensions.height)
      .attr('fill', 'transparent')
      .on('mousemove', function (event) {
        // Don't handle hover if we're currently dragging
        const { dragStartY } = getState()
        if (dragStartY !== null) {
          return
        }

        // Calculate which bar is being hovered based on Y position
        const [, y] = d3.pointer(event)
        const { tickScale } = context

        // Find the liquidity bar at this Y position
        const hoveredBar = liquidityData.find((d) => {
          const barY = tickScale(d.tick?.toString() ?? '') || 0
          const barHeight = tickScale.bandwidth()
          return y >= barY && y <= barY + barHeight
        })

        if (hoveredBar) {
          const actions = getActions()
          const barY = tickScale(hoveredBar.tick?.toString() ?? '') || 0
          actions.setChartState({
            hoveredY: barY + tickScale.bandwidth() / 2, // Center of the bar
            hoveredTick: hoveredBar,
          })
        } else {
          const actions = getActions()
          actions.setChartState({
            hoveredY: undefined,
            hoveredTick: undefined,
          })
        }
      })
      .on('mouseleave', function () {
        const actions = getActions()
        actions.setChartState({
          hoveredY: undefined,
          hoveredTick: undefined,
        })
      })

    if (isFullRange) {
      return
    }

    liquidityOverlay.attr('cursor', 'crosshair')

    // Helper function to calculate and constrain price range
    const calculatePriceRange = (startY: number, endY: number) => {
      const startPrice = yToPrice(startY)
      const endPrice = yToPrice(endY)

      // Determine new min/max based on drag direction
      const newMinPrice = Math.min(startPrice, endPrice)
      const newMaxPrice = Math.max(startPrice, endPrice)

      // Get data bounds
      const allPrices = [...priceData.map((d) => d.value), ...liquidityData.map((d) => d.price0)]
      const dataMin = Math.min(...allPrices)
      const dataMax = Math.max(...allPrices)

      // Constrain to data bounds
      const constrainedMinPrice = Math.max(newMinPrice, dataMin)
      const constrainedMaxPrice = Math.min(newMaxPrice, dataMax)

      return { constrainedMinPrice, constrainedMaxPrice }
    }

    // Helper function to handle common drag logic
    const handleDragEvent = ({
      event,
      isEnd,
    }: {
      event: d3.D3DragEvent<SVGRectElement, unknown, unknown>
      isEnd: boolean
    }) => {
      const { dragStartY } = getState()
      if (dragStartY === null) {
        return
      }

      const { constrainedMinPrice, constrainedMaxPrice } = calculatePriceRange(dragStartY, event.y)

      // Only update if we have a valid range
      if (constrainedMaxPrice > constrainedMinPrice) {
        setChartState({
          minPrice: constrainedMinPrice,
          maxPrice: constrainedMaxPrice,
        })
      }

      if (isEnd) {
        handlePriceChange('min', constrainedMinPrice)
        handlePriceChange('max', constrainedMaxPrice)

        setChartState({ dragStartY: null, dragCurrentTick: undefined })
      }
    }

    // Add drag behavior for range creation over liquidity area
    liquidityOverlay.call(
      d3
        .drag<SVGRectElement, unknown>()
        .on('start', (event) => {
          setChartState({ dragStartY: event.y })

          const { tickScale } = context

          // Find the tick at drag start position
          const dragStartTick = liquidityData.find((d) => {
            const barY = tickScale(d.tick?.toString() ?? '') || 0
            const barHeight = tickScale.bandwidth()
            return event.y >= barY && event.y <= barY + barHeight
          })

          setChartState({
            dragStartY: event.y,
            dragStartTick,
            // Clear hover state when starting drag
            hoveredY: undefined,
            hoveredTick: undefined,
          })
        })
        .on('drag', (event) => {
          const { tickScale } = context

          // Find the tick at current drag position
          const dragCurrentTick = liquidityData.find((d) => {
            const barY = tickScale(d.tick?.toString() ?? '') || 0
            const barHeight = tickScale.bandwidth()
            return event.y >= barY && event.y <= barY + barHeight
          })

          setChartState({
            dragCurrentTick,
            dragCurrentY: event.y,
          })

          handleDragEvent({ event, isEnd: false })
        })
        .on('end', (event) => handleDragEvent({ event, isEnd: true })),
    )
  }

  return { draw }
}
