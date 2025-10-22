import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type { ChartStoreState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import {
  calculateNewRange,
  calculateTickIndices,
  findClosestTick,
  getDataBounds,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import * as d3 from 'd3'

export function createDragActions(get: () => ChartStoreState) {
  return {
    createHandleDragBehavior: (lineType: 'min' | 'max') => {
      const { renderingContext, actions } = get()
      if (!renderingContext) {
        throw new Error('Rendering context not initialized')
      }

      const { yToPrice, priceToY, dimensions } = renderingContext

      // Helper function to constrain Y position to chart boundaries
      const clampYToChartBounds = (y: number) =>
        Math.max(
          -CHART_DIMENSIONS.DRAG_BOUNDARY_MARGIN,
          Math.min(dimensions.height + CHART_DIMENSIONS.DRAG_BOUNDARY_MARGIN, y),
        )

      // Helper function to update element position
      const updateElementPosition = (element: d3.Selection<SVGLineElement, unknown, null, undefined>, y: number) => {
        if (element.attr('y1')) {
          element.attr('y1', y).attr('y2', y)
        } else if (element.attr('cy')) {
          element.attr('cy', y)
        }
      }

      const shouldSwapLines = (draggedY: number, otherY: number): boolean => {
        return lineType === 'min' ? draggedY < otherY : draggedY > otherY
      }

      const applyMinHeightConstraint = (draggedY: number, otherY: number): number => {
        const pixelDistanceBetweenLines = Math.abs(draggedY - otherY)
        if (pixelDistanceBetweenLines < CHART_DIMENSIONS.RANGE_INDICATOR_MIN_HEIGHT) {
          return lineType === 'min'
            ? otherY + CHART_DIMENSIONS.RANGE_INDICATOR_MIN_HEIGHT
            : otherY - CHART_DIMENSIONS.RANGE_INDICATOR_MIN_HEIGHT
        }
        return draggedY
      }

      let initialMinPrice: number | undefined
      let initialMaxPrice: number | undefined

      // Helper function to calculate final prices from drag
      const calculateFinalPrices = (draggedY: number) => {
        const otherPrice = lineType === 'min' ? initialMaxPrice : initialMinPrice

        if (!otherPrice) {
          const newPrice = yToPrice(draggedY)
          return {
            finalMinPrice: lineType === 'min' ? newPrice : initialMinPrice,
            finalMaxPrice: lineType === 'min' ? initialMaxPrice : newPrice,
            constrainedY: draggedY,
          }
        }

        const otherY = priceToY({ price: otherPrice })

        const shouldSwap = shouldSwapLines(draggedY, otherY)
        const constrainedY = applyMinHeightConstraint(draggedY, otherY)
        const newPrice = yToPrice(draggedY)
        const constrainedPrice = yToPrice(constrainedY)

        let finalMinPrice: number | undefined
        let finalMaxPrice: number | undefined

        if (shouldSwap) {
          const swappedMinPrice = lineType === 'min' ? otherPrice : newPrice
          const swappedMaxPrice = lineType === 'min' ? newPrice : otherPrice
          const swappedDistance = Math.abs(priceToY({ price: swappedMaxPrice }) - priceToY({ price: swappedMinPrice! }))

          if (swappedDistance >= CHART_DIMENSIONS.RANGE_INDICATOR_MIN_HEIGHT) {
            finalMinPrice = swappedMinPrice
            finalMaxPrice = swappedMaxPrice
          } else {
            const constrainedSwapY =
              lineType === 'min'
                ? otherY - CHART_DIMENSIONS.RANGE_INDICATOR_MIN_HEIGHT
                : otherY + CHART_DIMENSIONS.RANGE_INDICATOR_MIN_HEIGHT
            const constrainedSwapPrice = yToPrice(constrainedSwapY)

            finalMinPrice = lineType === 'min' ? otherPrice : constrainedSwapPrice
            finalMaxPrice = lineType === 'min' ? constrainedSwapPrice : otherPrice
            draggedY = constrainedSwapY
          }
        } else {
          finalMinPrice = lineType === 'min' ? constrainedPrice : otherPrice
          finalMaxPrice = lineType === 'min' ? otherPrice : constrainedPrice
        }

        return { finalMinPrice, finalMaxPrice, constrainedY: draggedY }
      }

      return d3
        .drag()
        .on('start', () => {
          const { minPrice, maxPrice } = get()
          initialMinPrice = minPrice
          initialMaxPrice = maxPrice
        })
        .on('drag', (event) => {
          const clampedY = clampYToChartBounds(event.y)
          const { finalMinPrice, finalMaxPrice, constrainedY } = calculateFinalPrices(clampedY)

          // Update visual position of the dragged element
          updateElementPosition(d3.select(event.sourceEvent.target), constrainedY)

          // Update state for all other renderers
          actions.setChartState({
            minPrice: finalMinPrice,
            maxPrice: finalMaxPrice,
          })

          // Update all related elements
          actions.drawAll()
        })
        .on('end', (event) => {
          const clampedY = clampYToChartBounds(event.y)
          const { finalMinPrice, finalMaxPrice } = calculateFinalPrices(clampedY)

          // Update state for all other renderers
          actions.setChartState({
            minPrice: finalMinPrice,
            maxPrice: finalMaxPrice,
          })

          // Call callbacks once when drag ends
          if (finalMinPrice !== undefined && finalMaxPrice !== undefined) {
            actions.handlePriceChange('min', finalMinPrice)
            actions.handlePriceChange('max', finalMaxPrice)
          }
        })
    },

    createTickBasedDragBehavior: () => {
      let dragOffsetY = 0
      let tickRangeSize = 0

      // Helper function to handle common drag logic
      const handleTickDrag = ({
        event,
        isEnd,
      }: {
        event: d3.D3DragEvent<SVGRectElement, unknown, unknown>
        isEnd: boolean
      }) => {
        const { minPrice, maxPrice, renderingContext, actions } = get()

        if (minPrice === undefined || maxPrice === undefined || !renderingContext) {
          return
        }

        const { yToPrice, liquidityData, priceData, dimensions } = renderingContext

        // Apply the stored offset to maintain consistent drag feel
        const adjustedY = event.y - dragOffsetY
        const newCenterY = Math.max(0, Math.min(dimensions.height, adjustedY))
        const draggedPrice = yToPrice(newCenterY)

        // Find the tick corresponding to the dragged center position
        const centerTick = findClosestTick(liquidityData, draggedPrice)

        if (centerTick) {
          const tickIndices = calculateTickIndices(liquidityData)
          const newRange = calculateNewRange({ centerTick, tickRangeSize, tickIndices, liquidityData })

          // Get data bounds to prevent dragging outside chart
          const dataBounds = getDataBounds(priceData, liquidityData)

          // Only update if range stays within data bounds
          if (newRange.minPrice >= dataBounds.min && newRange.maxPrice <= dataBounds.max) {
            // Update state for all renderers following Zustand pattern
            actions.setChartState({
              minPrice: newRange.minPrice,
              maxPrice: newRange.maxPrice,
            })

            // Update all related elements
            actions.drawAll()

            // Call callbacks only when drag ends
            if (isEnd) {
              actions.handlePriceChange('min', newRange.minPrice)
              actions.handlePriceChange('max', newRange.maxPrice)
            }
          }
        }
      }

      return d3
        .drag<SVGRectElement, unknown>()
        .on('start', (event) => {
          const { minPrice, maxPrice, renderingContext } = get()
          if (minPrice === undefined || maxPrice === undefined || !renderingContext) {
            return
          }
          const { priceToY, liquidityData } = renderingContext

          // Store the initial offset relative to the range center
          const currentRangeCenterY = (priceToY({ price: maxPrice }) + priceToY({ price: minPrice })) / 2
          dragOffsetY = event.y - currentRangeCenterY

          // Calculate and store the initial tick range size
          const minTick = findClosestTick(liquidityData, minPrice)
          const maxTick = findClosestTick(liquidityData, maxPrice)

          if (minTick && maxTick) {
            const tickIndices = calculateTickIndices(liquidityData)
            const minIndex = tickIndices.find((t) => t.tick === minTick.tick)?.index || 0
            const maxIndex = tickIndices.find((t) => t.tick === maxTick.tick)?.index || 0
            tickRangeSize = Math.abs(maxIndex - minIndex)
          }
        })
        .on('drag', (event) => handleTickDrag({ event, isEnd: false }))
        .on('end', (event) => handleTickDrag({ event, isEnd: true }))
    },
  }
}
