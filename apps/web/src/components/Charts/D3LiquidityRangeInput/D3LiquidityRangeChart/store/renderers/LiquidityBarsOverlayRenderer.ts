import * as d3 from 'd3'
import { CHART_DIMENSIONS } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  ChartActions,
  ChartState,
  Renderer,
  RenderingContext,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { BucketChartEntry } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/liquidityBucketing/liquidityBucketing'
import { snapTickToSpacing } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import { ChartEntry } from '~/components/Charts/LiquidityRangeInput/types'

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

  // Helper to find which bucket contains a tick
  const findBucketForTick = (tick: number, buckets: BucketChartEntry[]): BucketChartEntry | undefined => {
    return buckets.find((b) => tick >= b.startTick && tick < b.endTick)
  }

  // Helper to find the closest rendered bucket to a tick
  const findClosestBucket = (tick: number, buckets: BucketChartEntry[]): BucketChartEntry | undefined => {
    if (buckets.length === 0) {
      return undefined
    }
    return buckets.reduce((prev, curr) => {
      const prevCenter = (prev.startTick + prev.endTick) / 2
      const currCenter = (curr.startTick + curr.endTick) / 2
      return Math.abs(currCenter - tick) < Math.abs(prevCenter - tick) ? curr : prev
    })
  }

  // Helper to create a synthetic ChartEntry from a rendered bucket
  // Uses bucket's own price0 and locked amounts — no liquidityData cross-reference
  const createEntryFromBucket = ({ bucket, tick }: { bucket: BucketChartEntry; tick: number }): ChartEntry => {
    return {
      tick,
      liquidityActive: Number(bucket.liquidityActive),
      price0: bucket.price0 ?? 0,
      amount0Locked: bucket.amount0Locked ?? 0,
      amount1Locked: bucket.amount1Locked ?? 0,
      bucket: {
        startTick: bucket.startTick,
        endTick: bucket.endTick,
      },
      segment: {
        startTick: bucket.segmentStartTick,
        endTick: bucket.segmentEndTick,
      },
    }
  }

  const draw = (): void => {
    // Clear previous overlay
    if (liquidityOverlay) {
      liquidityOverlay.remove()
    }

    const { dimensions, isFullRange } = getState()
    const { setChartState, handleTickChange } = getActions()

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

        // Calculate which tick is being hovered based on Y position
        const [, y] = d3.pointer(event)
        const { tickScale } = context

        // Convert Y position to tick using linear scale
        const hoveredTickValue = tickScale.yToTick(y)

        // Use rendered buckets from state (computed by LiquidityBarsRenderer)
        const { renderedBuckets } = getState()

        let hoveredBar: ChartEntry
        let barY: number = y

        if (renderedBuckets && renderedBuckets.length > 0) {
          // Find which bucket contains the hovered tick
          // Use raw (unsnapped) tick so the hover matches the visual bar position
          const bucket = findBucketForTick(hoveredTickValue, renderedBuckets)

          if (bucket) {
            // Use the bucket's startTick as the representative tick for consistent data
            // across the entire bar, regardless of where within the bar the cursor is
            const bucketTick = bucket.startTick
            // Show the bucket that's actually rendered using its startTick
            hoveredBar = createEntryFromBucket({ bucket, tick: bucketTick })
            barY = y

            // Check if hovered segment changed to avoid unnecessary redraws
            const { hoveredSegment: currentHoveredSegment } = getState()
            const newSegment = {
              startTick: bucket.segmentStartTick,
              endTick: bucket.segmentEndTick,
            }
            const segmentChanged =
              !currentHoveredSegment ||
              currentHoveredSegment.startTick !== newSegment.startTick ||
              currentHoveredSegment.endTick !== newSegment.endTick

            if (segmentChanged) {
              // Set the hovered segment and redraw to highlight all buckets in the same segment
              setChartState({ hoveredSegment: newSegment })
              getActions().drawAll()
            }
          } else {
            // No bucket at this tick - find closest rendered bucket
            const closestBucket = findClosestBucket(hoveredTickValue, renderedBuckets)
            if (closestBucket) {
              hoveredBar = createEntryFromBucket({ bucket: closestBucket, tick: Math.round(hoveredTickValue) })
              hoveredBar.liquidityActive = 0
            } else {
              return
            }
            // Clear hovered segment when not over a bucket
            const { hoveredSegment: currentHoveredSegment } = getState()
            if (currentHoveredSegment) {
              setChartState({ hoveredSegment: undefined })
              getActions().drawAll()
            }
          }
        } else {
          return
        }

        const actions = getActions()
        actions.setChartState({
          hoveredY: barY,
          hoveredTick: hoveredBar,
        })
      })
      .on('mouseleave', function () {
        const actions = getActions()
        const { hoveredSegment: currentHoveredSegment } = getState()
        actions.setChartState({
          hoveredY: undefined,
          hoveredTick: undefined,
          hoveredSegment: undefined,
        })
        // Redraw to clear segment highlighting
        if (currentHoveredSegment) {
          actions.drawAll()
        }
      })

    if (isFullRange) {
      return
    }

    liquidityOverlay.attr('cursor', 'crosshair')

    // Helper function to calculate and constrain tick range
    const calculateTickRange = (startY: number, endY: number) => {
      const { tickScale, tickSpacing } = context

      // Convert Y positions directly to ticks
      const startTick = tickScale.yToTick(startY)
      const endTick = tickScale.yToTick(endY)

      // Floor the lower tick to include its bucket, ceil the upper tick to include its bucket
      const lowerTick = Math.min(startTick, endTick)
      const upperTick = Math.max(startTick, endTick)
      const constrainedMinTick = Math.floor(lowerTick / tickSpacing) * tickSpacing
      const constrainedMaxTick = Math.ceil(upperTick / tickSpacing) * tickSpacing

      return {
        constrainedMinTick,
        constrainedMaxTick,
      }
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

      const { constrainedMinTick, constrainedMaxTick } = calculateTickRange(dragStartY, event.y)
      const actions = getActions()

      // Update state for all renderers
      actions.setChartState({
        minTick: constrainedMinTick,
        maxTick: constrainedMaxTick,
      })

      // Update all related elements
      actions.drawAll()

      if (isEnd) {
        handleTickChange({ changeType: 'min', tick: constrainedMinTick })
        handleTickChange({ changeType: 'max', tick: constrainedMaxTick })

        actions.setChartState({ dragStartY: null, dragCurrentTick: undefined })
      }
    }

    // Helper to create a tick entry for drag tooltips
    // Uses rendered buckets for consistent data
    const createDragTickEntry = (tickValue: number): ChartEntry | undefined => {
      const { renderedBuckets } = getState()
      if (!renderedBuckets || renderedBuckets.length === 0) {
        return undefined
      }

      const bucket = findBucketForTick(tickValue, renderedBuckets)
      if (bucket) {
        return createEntryFromBucket({ bucket, tick: bucket.startTick })
      }

      // Fallback: find closest rendered bucket
      const closestBucket = findClosestBucket(tickValue, renderedBuckets)
      if (!closestBucket) {
        return undefined
      }
      const snappedTick = snapTickToSpacing(Math.round(tickValue), context.tickSpacing)
      return createEntryFromBucket({ bucket: closestBucket, tick: snappedTick })
    }

    // Add drag behavior for range creation over liquidity area
    liquidityOverlay.call(
      d3
        .drag<SVGRectElement, unknown>()
        .on('start', (event) => {
          const { tickScale } = context
          const tickValue = tickScale.yToTick(event.y)

          setChartState({
            dragStartY: event.y,
            dragStartTick: createDragTickEntry(tickValue),
            // Clear hover state when starting drag
            hoveredY: undefined,
            hoveredTick: undefined,
          })
        })
        .on('drag', (event) => {
          const { tickScale } = context
          const tickValue = tickScale.yToTick(event.y)

          setChartState({
            dragCurrentTick: createDragTickEntry(tickValue),
            dragCurrentY: event.y,
          })

          handleDragEvent({ event, isEnd: false })
        })
        .on('end', (event) => handleDragEvent({ event, isEnd: true })),
    )
  }

  return { draw }
}
