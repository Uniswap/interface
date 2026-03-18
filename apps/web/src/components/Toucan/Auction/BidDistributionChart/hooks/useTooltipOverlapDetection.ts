import type { RefObject } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import { TOOLTIP_STACKING } from '~/components/Toucan/Auction/BidDistributionChart/constants'

interface Position {
  left: number
  top: number
}

interface OverlapDetectionParams {
  bidLineTooltipRef: RefObject<HTMLDivElement | null>
  clearingPriceTooltipRef: RefObject<HTMLDivElement | null>
  bidLineVisible: boolean
  clearingPriceVisible: boolean
  originalBidLinePosition: Position
  originalClearingPricePosition: Position
  /** Whether the bid line tooltip is flipped to the left side */
  bidLineFlipLeft?: boolean
  /** Force stacking even without DOM overlap detection (e.g., when clicking near clearing price) */
  forceStack?: boolean
}

interface StackedPositions {
  isStacked: boolean
  bidLine: Position
  clearingPrice: Position
  /** When true, the clearing price tooltip should also flip left (to match stacked bid tooltip) */
  clearingPriceFlipLeft: boolean
}

interface TooltipPositions {
  bidLine: Position
  clearingPrice: Position
}

/**
 * Check if new positions differ from previously cached positions.
 */
function positionsChanged(prev: TooltipPositions | null, next: TooltipPositions): boolean {
  if (!prev) {
    return true
  }
  return (
    prev.bidLine.left !== next.bidLine.left ||
    prev.bidLine.top !== next.bidLine.top ||
    prev.clearingPrice.left !== next.clearingPrice.left ||
    prev.clearingPrice.top !== next.clearingPrice.top
  )
}

/**
 * Check if two DOMRect objects overlap (have any intersection).
 */
function rectsOverlap(a: DOMRect, b: DOMRect): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
}

/** Threshold in pixels for considering tooltips horizontally close */
const HORIZONTAL_PROXIMITY_THRESHOLD = 50

/**
 * Check if two rectangles are close enough horizontally that they would overlap
 * if they were at the same vertical position. This helps detect when tooltips
 * would conflict even if they're currently positioned to avoid overlap.
 */
function rectsAreHorizontallyClose(a: DOMRect, b: DOMRect): boolean {
  // They overlap horizontally if one starts before the other ends
  const horizontalOverlap = a.left <= b.right && b.left <= a.right
  if (horizontalOverlap) {
    return true
  }

  // Or they're within threshold distance horizontally
  const horizontalDistance = Math.min(Math.abs(a.left - b.right), Math.abs(b.left - a.right))
  return horizontalDistance <= HORIZONTAL_PROXIMITY_THRESHOLD
}

/**
 * Hook that detects overlap between BidLineTooltip and ClearingPriceTooltip
 * and returns adjusted positions for stacking them vertically when they overlap.
 *
 * Per Figma design:
 * - When overlapping, both tooltips stack at BidLineTooltip's horizontal position
 * - ClearingPriceTooltip appears on top
 * - BidLineTooltip appears below with a small gap
 *
 * Uses useLayoutEffect to measure DOM before paint, preventing visual flicker.
 * Tracks previous overlap state to avoid unnecessary re-renders.
 */
export function useTooltipOverlapDetection(params: OverlapDetectionParams): StackedPositions {
  const {
    bidLineTooltipRef,
    clearingPriceTooltipRef,
    bidLineVisible,
    clearingPriceVisible,
    originalBidLinePosition,
    originalClearingPricePosition,
    bidLineFlipLeft,
    forceStack,
  } = params

  const [stackedPositions, setStackedPositions] = useState<StackedPositions>({
    isStacked: false,
    bidLine: originalBidLinePosition,
    clearingPrice: originalClearingPricePosition,
    clearingPriceFlipLeft: false,
  })

  // Track previous state to avoid unnecessary updates
  const prevIsStackedRef = useRef(false)
  const prevPositionsRef = useRef<{
    bidLine: { left: number; top: number }
    clearingPrice: { left: number; top: number }
  } | null>(null)

  // Extract primitive values to use in effect (avoids object reference issues)
  const bidLineLeft = originalBidLinePosition.left
  const bidLineTop = originalBidLinePosition.top
  const clearingPriceLeft = originalClearingPricePosition.left
  const clearingPriceTop = originalClearingPricePosition.top

  useLayoutEffect(() => {
    const originalPositions: TooltipPositions = {
      bidLine: { left: bidLineLeft, top: bidLineTop },
      clearingPrice: { left: clearingPriceLeft, top: clearingPriceTop },
    }

    // Helper to update state only when positions actually changed
    const updateIfChanged = ({
      isStacked,
      positions,
      flipLeft,
    }: {
      isStacked: boolean
      positions: TooltipPositions
      flipLeft: boolean
    }): void => {
      const stackedStateChanged = prevIsStackedRef.current !== isStacked
      if (stackedStateChanged || positionsChanged(prevPositionsRef.current, positions)) {
        prevIsStackedRef.current = isStacked
        prevPositionsRef.current = positions
        setStackedPositions({
          isStacked,
          bidLine: positions.bidLine,
          clearingPrice: positions.clearingPrice,
          clearingPriceFlipLeft: flipLeft,
        })
      }
    }

    // If either tooltip is not visible, no overlap possible - return original positions
    if (!bidLineVisible || !clearingPriceVisible) {
      updateIfChanged({ isStacked: false, positions: originalPositions, flipLeft: false })
      return
    }

    const bidLineEl = bidLineTooltipRef.current
    const clearingPriceEl = clearingPriceTooltipRef.current

    if (!bidLineEl || !clearingPriceEl) {
      return
    }

    // Batch read DOM measurements (single layout read)
    const bidLineRect = bidLineEl.getBoundingClientRect()
    const clearingPriceRect = clearingPriceEl.getBoundingClientRect()

    const overlaps = rectsOverlap(bidLineRect, clearingPriceRect)

    // Check if tooltips are horizontally close (would conflict if at same Y position)
    const horizontallyClose = rectsAreHorizontallyClose(bidLineRect, clearingPriceRect)

    // Stack if:
    // 1. DOM rects actually overlap, OR
    // 2. forceStack is true (click triggered stacking), OR
    // 3. We were previously stacked AND tooltips are still horizontally close
    //    (this keeps them stacked once triggered, until user moves bid away)
    const shouldStack = overlaps || forceStack || (prevIsStackedRef.current && horizontallyClose)

    if (shouldStack) {
      // Stack tooltips: align to BidLine's X position, ClearingPrice on top, BidLine below
      const stackedClearingPriceTop = bidLineTop
      const stackedBidLineTop = stackedClearingPriceTop + clearingPriceRect.height + TOOLTIP_STACKING.GAP
      const stackedPositions: TooltipPositions = {
        bidLine: { left: bidLineLeft, top: stackedBidLineTop },
        clearingPrice: { left: bidLineLeft, top: stackedClearingPriceTop },
      }
      updateIfChanged({ isStacked: true, positions: stackedPositions, flipLeft: Boolean(bidLineFlipLeft) })
    } else {
      updateIfChanged({ isStacked: false, positions: originalPositions, flipLeft: false })
    }
  }, [
    bidLineVisible,
    clearingPriceVisible,
    bidLineLeft,
    bidLineTop,
    clearingPriceLeft,
    clearingPriceTop,
    bidLineTooltipRef,
    clearingPriceTooltipRef,
    bidLineFlipLeft,
    forceStack,
  ])

  return stackedPositions
}
