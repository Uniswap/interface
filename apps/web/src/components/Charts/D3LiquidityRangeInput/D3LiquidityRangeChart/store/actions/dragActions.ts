import { TickMath } from '@uniswap/v3-sdk'
import * as d3 from 'd3'
import { CHART_DIMENSIONS } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type { ChartStoreState } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { snapTickToSpacing } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'

export function createDragActions(get: () => ChartStoreState) {
  return {
    createHandleDragBehavior: (lineType: 'min' | 'max') => {
      const { renderingContext, actions } = get()
      if (!renderingContext) {
        throw new Error('Rendering context not initialized')
      }

      const { yToTick, tickToY, tickSpacing, dimensions } = renderingContext

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

      const shouldSwapLines = (draggedTick: number, otherTick: number): boolean => {
        return lineType === 'min' ? draggedTick > otherTick : draggedTick < otherTick
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

      let initialMinTick: number | undefined
      let initialMaxTick: number | undefined

      // Helper function to calculate final ticks from drag
      const calculateFinalTicks = (draggedY: number) => {
        const otherTick = lineType === 'min' ? initialMaxTick : initialMinTick

        // Get raw tick from Y and snap to tickSpacing
        const rawTick = yToTick(draggedY)
        const snappedTick = snapTickToSpacing(rawTick, tickSpacing)

        if (otherTick === undefined) {
          return {
            minTick: lineType === 'min' ? snappedTick : initialMinTick,
            maxTick: lineType === 'min' ? initialMaxTick : snappedTick,
            constrainedY: draggedY,
          }
        }

        const otherY = tickToY({ tick: otherTick })

        const shouldSwap = shouldSwapLines(snappedTick, otherTick)
        const constrainedY = applyMinHeightConstraint(draggedY, otherY)
        const constrainedTick = snapTickToSpacing(yToTick(constrainedY), tickSpacing)

        let finalMinTick: number
        let finalMaxTick: number

        if (shouldSwap) {
          // Swap the lines
          finalMinTick = lineType === 'min' ? otherTick : snappedTick
          finalMaxTick = lineType === 'min' ? snappedTick : otherTick

          // Check if swapped distance meets minimum
          const swappedDistance = Math.abs(tickToY({ tick: finalMaxTick }) - tickToY({ tick: finalMinTick }))
          if (swappedDistance < CHART_DIMENSIONS.RANGE_INDICATOR_MIN_HEIGHT) {
            const constrainedSwapY =
              lineType === 'min'
                ? otherY - CHART_DIMENSIONS.RANGE_INDICATOR_MIN_HEIGHT
                : otherY + CHART_DIMENSIONS.RANGE_INDICATOR_MIN_HEIGHT
            const constrainedSwapTick = snapTickToSpacing(yToTick(constrainedSwapY), tickSpacing)

            finalMinTick = lineType === 'min' ? otherTick : constrainedSwapTick
            finalMaxTick = lineType === 'min' ? constrainedSwapTick : otherTick
          }
        } else {
          finalMinTick = lineType === 'min' ? constrainedTick : otherTick
          finalMaxTick = lineType === 'min' ? otherTick : constrainedTick
        }

        return {
          minTick: finalMinTick,
          maxTick: finalMaxTick,
          constrainedY,
        }
      }

      return d3
        .drag()
        .on('start', () => {
          const { minTick, maxTick } = get()
          initialMinTick = minTick
          initialMaxTick = maxTick
        })
        .on('drag', (event) => {
          const clampedY = clampYToChartBounds(event.y)
          const { constrainedY, minTick, maxTick } = calculateFinalTicks(clampedY)

          // Update visual position of the dragged element
          updateElementPosition(d3.select(event.sourceEvent.target), constrainedY)

          // Update state for all other renderers
          actions.setChartState({
            minTick,
            maxTick,
          })

          // Update all related elements
          actions.drawAll()
        })
        .on('end', (event) => {
          const clampedY = clampYToChartBounds(event.y)
          const { minTick, maxTick } = calculateFinalTicks(clampedY)

          // Update state for all other renderers
          actions.setChartState({
            minTick,
            maxTick,
          })

          // Call callbacks once when drag ends
          actions.handleTickChange({ changeType: 'min', tick: minTick })
          actions.handleTickChange({ changeType: 'max', tick: maxTick })
        })
    },

    createTickBasedDragBehavior: () => {
      let dragOffsetY = 0
      let tickRangeSize = 0 // Now stores actual tick difference, not index difference

      // Helper function to handle common drag logic
      const handleTickDrag = ({
        event,
        isEnd,
      }: {
        event: d3.D3DragEvent<SVGRectElement, unknown, unknown>
        isEnd: boolean
      }) => {
        const { minTick, maxTick, renderingContext, actions } = get()

        if (minTick === undefined || maxTick === undefined || !renderingContext) {
          return
        }

        const { dimensions, yToTick, tickSpacing } = renderingContext

        // Apply the stored offset to maintain consistent drag feel
        const adjustedY = event.y - dragOffsetY
        const newCenterY = Math.max(0, Math.min(dimensions.height, adjustedY))
        const draggedTick = yToTick(newCenterY)

        // Snap center tick to tickSpacing
        const centerTick = snapTickToSpacing(draggedTick, tickSpacing)

        // Calculate new min/max ticks based on center and range size
        const halfRange = Math.floor(tickRangeSize / 2)
        let newMinTick = snapTickToSpacing(centerTick - halfRange, tickSpacing)
        let newMaxTick = snapTickToSpacing(centerTick + halfRange, tickSpacing)

        // Clamp to valid tick range
        if (newMinTick < TickMath.MIN_TICK) {
          newMinTick = snapTickToSpacing(TickMath.MIN_TICK, tickSpacing)
          newMaxTick = snapTickToSpacing(newMinTick + tickRangeSize, tickSpacing)
        }
        if (newMaxTick > TickMath.MAX_TICK) {
          newMaxTick = snapTickToSpacing(TickMath.MAX_TICK, tickSpacing)
          newMinTick = snapTickToSpacing(newMaxTick - tickRangeSize, tickSpacing)
        }

        // Update state for all renderers
        actions.setChartState({
          minTick: newMinTick,
          maxTick: newMaxTick,
        })

        // Update all related elements
        actions.drawAll()

        // Call callbacks only when drag ends
        if (isEnd) {
          actions.handleTickChange({ changeType: 'min', tick: newMinTick })
          actions.handleTickChange({ changeType: 'max', tick: newMaxTick })
        }
      }

      return d3
        .drag<SVGRectElement, unknown>()
        .on('start', (event) => {
          const { minTick, maxTick, renderingContext } = get()
          if (minTick === undefined || maxTick === undefined || !renderingContext) {
            return
          }
          const { tickToY } = renderingContext

          // Store the initial offset relative to the range center
          const currentRangeCenterY = (tickToY({ tick: maxTick }) + tickToY({ tick: minTick })) / 2
          dragOffsetY = event.y - currentRangeCenterY

          // Store the initial tick range size (actual tick difference)
          tickRangeSize = maxTick - minTick
        })
        .on('drag', (event) => handleTickDrag({ event, isEnd: false }))
        .on('end', (event) => handleTickDrag({ event, isEnd: true }))
    },
  }
}
