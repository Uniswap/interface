import { calculateMaxValidBidQ96, snapToNearestTick } from '@universe/cca'
import { useEffect, useMemo, useRef } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { MAX_PERCENTAGE, SLIDER_RESOLUTION } from '~/features/Toucan/Shared/valuationSliderParts/constants'
import { positionToTickOffset, tickOffsetToPosition } from '~/features/Toucan/Shared/valuationSliderParts/curve'
import type { ClampParams, ValuationSliderProps } from '~/features/Toucan/Shared/valuationSliderParts/types'

export const clamp = ({ value, min, max }: ClampParams): number => Math.min(Math.max(value, min), max)

interface UseValuationSliderParams {
  valueQ96: ValuationSliderProps['valueQ96']
  onChangeQ96: ValuationSliderProps['onChangeQ96']
  onInteractionStart: ValuationSliderProps['onInteractionStart']
  clearingPriceQ96: ValuationSliderProps['clearingPriceQ96']
  floorPriceQ96: ValuationSliderProps['floorPriceQ96']
  tickSizeQ96: ValuationSliderProps['tickSizeQ96']
  maxSliderPriceQ96: bigint | undefined
  maxBidPriceQ96: ValuationSliderProps['maxBidPriceQ96']
  tickGrouping: ValuationSliderProps['tickGrouping']
  groupTicksEnabled: ValuationSliderProps['groupTicksEnabled']
}

interface SnapToCanonicalParams {
  value: bigint
  floorPriceQ96: bigint
  clearingPriceQ96: bigint
  tickSizeQ96: bigint
  minPriceQ96: bigint
  groupSizeTicks: number | undefined
  /** The track's last offset. Rounding to a stride can overshoot it, so the snap clamps. */
  maxTickOffset: number
}

/**
 * The single place a price becomes a value this slider can actually hold: snapped to the
 * floor-anchored tick grid, then to the group stride when grouping is on.
 *
 * Shared by `sanitizedValueQ96` and by the track's top on purpose. Deriving the top any
 * other way lets the two drift, and every drift makes "is the thumb at the end" quietly
 * unanswerable — first when the top snapped DOWN off-grid, then again when grouping moved
 * it and the tick snap alone did not.
 */
export function snapToCanonicalValue({
  value,
  floorPriceQ96,
  clearingPriceQ96,
  tickSizeQ96,
  minPriceQ96,
  groupSizeTicks,
  maxTickOffset,
}: SnapToCanonicalParams): bigint {
  // Anchored on minPrice SNAPPED to the grid, not on minPrice itself. minPrice is
  // clearing + tick and is off-grid whenever clearing is, so striding from it re-introduces
  // the offset the tick snap removes and returns a price that is not on any tick: floor
  // 1000 / tick 100 / clearing 1050 turned an on-grid 2200 back into 2150.
  //
  // Adding whole ticks cannot change the rounding remainder, so this is exactly
  // snapToNearestTick(minPrice + k ticks) for every k — including the track's top.
  const gridAnchorQ96 = snapToNearestTick({
    value: minPriceQ96,
    floorPrice: floorPriceQ96,
    clearingPrice: clearingPriceQ96,
    tickSize: tickSizeQ96,
  })
  const trackTopQ96 = gridAnchorQ96 + tickSizeQ96 * BigInt(maxTickOffset)

  // Bounded before the grouping branch, not inside it: snapToNearestTick has no upper
  // bound, so an ungrouped value above the track used to come straight back out and the
  // label could quote a price above the ceiling while the thumb sat pinned at the end.
  const snappedToTick = snapToNearestTick({
    value,
    floorPrice: floorPriceQ96,
    clearingPrice: clearingPriceQ96,
    tickSize: tickSizeQ96,
  })
  const boundedQ96 = snappedToTick > trackTopQ96 ? trackTopQ96 : snappedToTick

  if (!groupSizeTicks) {
    return boundedQ96
  }

  const delta = boundedQ96 - gridAnchorQ96
  if (delta < 0n) {
    return boundedQ96
  }

  const groupSize = Math.max(1, groupSizeTicks)
  const snappedIndex = clamp({
    value: Math.round(Number(delta / tickSizeQ96) / groupSize) * groupSize,
    min: 0,
    max: maxTickOffset,
  })
  return gridAnchorQ96 + tickSizeQ96 * BigInt(snappedIndex)
}

export function useValuationSlider({
  valueQ96,
  onChangeQ96,
  onInteractionStart,
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
  maxSliderPriceQ96,
  maxBidPriceQ96,
  tickGrouping,
  groupTicksEnabled,
}: UseValuationSliderParams) {
  // minPrice is clearingPrice + 1 tick (which corresponds to 0%)
  const minPriceQ96 = useMemo(() => {
    if (!clearingPriceQ96 || !tickSizeQ96) {
      return undefined
    }
    return clearingPriceQ96 + tickSizeQ96
  }, [clearingPriceQ96, tickSizeQ96])

  // Number of ticks between minPrice and the max slider price. This is the
  // real price-space range; the slider UI only uses SLIDER_RESOLUTION
  // positions on top of it, mapped exponentially.
  const { maxTickOffset, isCeilingBound } = useMemo(() => {
    if (!minPriceQ96 || !tickSizeQ96) {
      return { maxTickOffset: 0, isCeilingBound: false }
    }

    const rangeTicks = (() => {
      if (maxSliderPriceQ96 && maxSliderPriceQ96 > minPriceQ96) {
        const range = maxSliderPriceQ96 - minPriceQ96
        return Number((range + tickSizeQ96 - 1n) / tickSizeQ96)
      }

      // Default: MAX_PERCENTAGE (500x) of the clearing price
      const numerator = minPriceQ96 * BigInt(MAX_PERCENTAGE)
      const denominator = 100n * tickSizeQ96
      return Number((numerator + denominator - 1n) / denominator)
    })()

    if (maxBidPriceQ96 === undefined || !floorPriceQ96) {
      return { maxTickOffset: rangeTicks, isCeilingBound: false }
    }

    // A validation hook's ceiling only ever narrows the track, never widens it: a ceiling
    // above the default range must not blow the range out.
    //
    // The bound comes from the shared tick helper rather than being derived here, so it
    // cannot drift from the one input validation enforces. That matters because this
    // hook's own `minPriceQ96` is `clearingPrice + tickSize`, which is NOT necessarily on
    // the floor-anchored grid the contract uses — deriving the ceiling from it would let
    // the top of the track land above the highest tick the hook actually accepts.
    const maxValidBidQ96 = calculateMaxValidBidQ96({ maxBidPriceQ96, floorPriceQ96, tickSizeQ96 })
    if (maxValidBidQ96 === undefined || maxValidBidQ96 < minPriceQ96) {
      // No tick is both above clearing and at or below the ceiling — nothing to pick.
      return { maxTickOffset: 0, isCeilingBound: true }
    }
    const ceilingTicks = Number((maxValidBidQ96 - minPriceQ96) / tickSizeQ96)
    // Only report the ceiling as the bound when it is actually the narrower of the two.
    // A ceiling above the default range leaves the track ending short of it, and saying
    // "bids cannot exceed X" there would name a limit the user has not reached.
    return { maxTickOffset: Math.min(rangeTicks, ceilingTicks), isCeilingBound: ceilingTicks <= rangeTicks }
  }, [minPriceQ96, tickSizeQ96, maxSliderPriceQ96, maxBidPriceQ96, floorPriceQ96])

  // Slider's step count. Cap at SLIDER_RESOLUTION for smoothness; when the
  // underlying tick range is smaller, match it 1:1 so every tick is reachable.
  const totalTicks = useMemo(() => {
    if (maxTickOffset <= 0) {
      return 0
    }
    return Math.min(maxTickOffset, SLIDER_RESOLUTION)
  }, [maxTickOffset])

  const requestedGroupSizeTicks = groupTicksEnabled && tickGrouping ? tickGrouping.groupSizeTicks : undefined

  // The stride comes from the chart's zoom level, so it can be much wider than a track the
  // ceiling has narrowed. Once it is, every reachable offset rounds to the same multiple:
  // drags all land on the anchor, the legal ticks under the ceiling become unselectable,
  // and the track's top collapses onto its bottom — which would leave isAtTrackMax
  // permanently true and fire the ceiling hint from the very bottom of the track.
  const groupSizeTicks =
    requestedGroupSizeTicks && requestedGroupSizeTicks <= maxTickOffset ? requestedGroupSizeTicks : undefined

  /**
   * Everything snapToCanonicalValue needs except the value itself, bound once.
   *
   * The guarantee that the emitted price, the thumb label and the track's top agree rests on
   * all three going through the same snap with the same context. Passing six arguments at
   * three call sites made that a convention; binding them makes it structural.
   */
  const snapContext = useMemo(
    () =>
      minPriceQ96 && tickSizeQ96 && clearingPriceQ96 && floorPriceQ96
        ? { floorPriceQ96, clearingPriceQ96, tickSizeQ96, minPriceQ96, groupSizeTicks, maxTickOffset }
        : undefined,
    [floorPriceQ96, clearingPriceQ96, tickSizeQ96, minPriceQ96, groupSizeTicks, maxTickOffset],
  )

  const sanitizedValueQ96 = useMemo(() => {
    if (!valueQ96 || !snapContext) {
      return minPriceQ96
    }
    return snapToCanonicalValue({ ...snapContext, value: valueQ96 })
  }, [snapContext, minPriceQ96, valueQ96])

  /**
   * Whether the value sits at the last position the track can express.
   *
   * Compared in PRICE space against the track's top snapped the same way values are, not by
   * index: `minPriceQ96` is clearing + tick and need not sit on the floor-anchored grid, so
   * the top can snap DOWN to a lower tick and `sliderIndex` then never reaches `totalTicks`.
   * Floor 1000 / tick 100 / clearing 1010 puts the top at 1410, which snaps to 1400 — index
   * 2 of 3, so an index comparison would never match and the drag-past hint could not fire.
   */
  const isAtTrackMax = useMemo(() => {
    if (!snapContext || !sanitizedValueQ96) {
      return false
    }
    const trackTopQ96 = snapToCanonicalValue({
      ...snapContext,
      value: snapContext.minPriceQ96 + snapContext.tickSizeQ96 * BigInt(snapContext.maxTickOffset),
    })
    return sanitizedValueQ96 >= trackTopQ96
  }, [snapContext, sanitizedValueQ96])

  const sliderIndex = useMemo(() => {
    if (!sanitizedValueQ96 || !minPriceQ96 || !tickSizeQ96 || totalTicks === 0) {
      return 0
    }
    const delta = sanitizedValueQ96 - minPriceQ96
    if (delta <= 0n) {
      return 0
    }
    const tickOffset = Number(delta / tickSizeQ96)
    return tickOffsetToPosition({ tickOffset, maxTickOffset, resolution: totalTicks })
  }, [minPriceQ96, sanitizedValueQ96, tickSizeQ96, maxTickOffset, totalTicks])

  const clampedSliderIndex = clamp({ value: sliderIndex, min: 0, max: totalTicks })

  // Track whether user is actively dragging the slider to prevent spurious change events
  // when clicking elsewhere in the form (a Tamagui Slider issue on mobile)
  const isDraggingRef = useRef(false)
  // Store cleanup function to remove document listeners on unmount
  const cleanupListenersRef = useRef<(() => void) | null>(null)

  const handlePointerUp = useEvent(() => {
    // Use setTimeout to allow the final onValueChange to process before we stop accepting changes
    setTimeout(() => {
      isDraggingRef.current = false
    }, 100)
  })

  const handlePointerDown = useEvent(() => {
    isDraggingRef.current = true
    // Notify parent before blur can fire (prevents race condition with input blur handler)
    onInteractionStart?.()

    // Clean up any existing listener from a previous drag that wasn't resolved
    if (cleanupListenersRef.current) {
      cleanupListenersRef.current()
    }

    // Add document-level listener to catch pointer up anywhere (not just on the slider)
    const onDocumentPointerUp = (): void => {
      handlePointerUp()
      document.removeEventListener('pointerup', onDocumentPointerUp)
      document.removeEventListener('pointercancel', onDocumentPointerUp)
      cleanupListenersRef.current = null
    }
    document.addEventListener('pointerup', onDocumentPointerUp)
    document.addEventListener('pointercancel', onDocumentPointerUp)
    // Store cleanup in case component unmounts mid-drag
    cleanupListenersRef.current = onDocumentPointerUp
  })

  // Cleanup document listeners on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (cleanupListenersRef.current) {
        document.removeEventListener('pointerup', cleanupListenersRef.current)
        document.removeEventListener('pointercancel', cleanupListenersRef.current)
        cleanupListenersRef.current = null
      }
    }
  }, [])

  // Linear in slider space — correct for thumb position (the curve is already
  // baked into the position→tick-offset mapping).
  const progress = totalTicks > 0 ? clampedSliderIndex / totalTicks : 0

  const handleTickValueChange = useEvent((next: number[]) => {
    // Ignore spurious change events when not actively dragging
    if (!isDraggingRef.current) {
      return
    }

    if (!minPriceQ96 || !tickSizeQ96 || !floorPriceQ96 || !clearingPriceQ96 || totalTicks === 0) {
      return
    }
    const nextPosition = clamp({
      value: next[0] ?? 0,
      min: 0,
      max: totalTicks,
    })

    const tickOffset = positionToTickOffset({
      position: nextPosition,
      maxTickOffset,
      resolution: totalTicks,
    })

    // Emitted through the same snap the value is read back through. Anchoring on
    // minPriceQ96 alone put the emitted price off the floor grid whenever clearing is off
    // it — a drag to the end emitted 1410 while the label and the submitted price both
    // said 1400.
    if (!snapContext) {
      return
    }
    onChangeQ96(snapToCanonicalValue({ ...snapContext, value: minPriceQ96 + tickSizeQ96 * BigInt(tickOffset) }))
  })

  return {
    totalTicks,
    isCeilingBound,
    isAtTrackMax,
    clampedSliderIndex,
    progress,
    isDraggingRef,
    handlePointerDown,
    handleTickValueChange,
    minPriceQ96,
    sanitizedValueQ96,
  }
}
