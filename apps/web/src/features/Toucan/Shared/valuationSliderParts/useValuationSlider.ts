import { useEffect, useMemo, useRef } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { snapToNearestTick } from '~/features/Toucan/Auction/utils/ticks'
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
  tickGrouping: ValuationSliderProps['tickGrouping']
  groupTicksEnabled: ValuationSliderProps['groupTicksEnabled']
}

export function useValuationSlider({
  valueQ96,
  onChangeQ96,
  onInteractionStart,
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
  maxSliderPriceQ96,
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
  const maxTickOffset = useMemo(() => {
    if (!minPriceQ96 || !tickSizeQ96) {
      return 0
    }

    if (maxSliderPriceQ96 && maxSliderPriceQ96 > minPriceQ96) {
      const range = maxSliderPriceQ96 - minPriceQ96
      return Number((range + tickSizeQ96 - 1n) / tickSizeQ96)
    }

    // Default: MAX_PERCENTAGE (500x) of the clearing price
    const numerator = minPriceQ96 * BigInt(MAX_PERCENTAGE)
    const denominator = 100n * tickSizeQ96
    return Number((numerator + denominator - 1n) / denominator)
  }, [minPriceQ96, tickSizeQ96, maxSliderPriceQ96])

  // Slider's step count. Cap at SLIDER_RESOLUTION for smoothness; when the
  // underlying tick range is smaller, match it 1:1 so every tick is reachable.
  const totalTicks = useMemo(() => {
    if (maxTickOffset <= 0) {
      return 0
    }
    return Math.min(maxTickOffset, SLIDER_RESOLUTION)
  }, [maxTickOffset])

  const sanitizedValueQ96 = useMemo(() => {
    if (!valueQ96 || !clearingPriceQ96 || !floorPriceQ96 || !tickSizeQ96) {
      return minPriceQ96
    }

    const snappedToTick = snapToNearestTick({
      value: valueQ96,
      floorPrice: floorPriceQ96,
      clearingPrice: clearingPriceQ96,
      tickSize: tickSizeQ96,
    })

    if (groupTicksEnabled && tickGrouping && minPriceQ96) {
      const delta = snappedToTick - minPriceQ96
      if (delta >= 0n) {
        const index = Number(delta / tickSizeQ96)
        const groupSize = Math.max(1, tickGrouping.groupSizeTicks)
        const snappedIndex = Math.round(index / groupSize) * groupSize
        return minPriceQ96 + tickSizeQ96 * BigInt(snappedIndex)
      }
    }

    return snappedToTick
  }, [clearingPriceQ96, floorPriceQ96, groupTicksEnabled, minPriceQ96, tickGrouping, tickSizeQ96, valueQ96])

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

    if (!minPriceQ96 || !tickSizeQ96 || totalTicks === 0) {
      return
    }
    const nextPosition = clamp({
      value: next[0] ?? 0,
      min: 0,
      max: totalTicks,
    })

    let tickOffset = positionToTickOffset({
      position: nextPosition,
      maxTickOffset,
      resolution: totalTicks,
    })

    if (groupTicksEnabled && tickGrouping) {
      const groupSize = Math.max(1, tickGrouping.groupSizeTicks)
      tickOffset = Math.round(tickOffset / groupSize) * groupSize
      tickOffset = clamp({ value: tickOffset, min: 0, max: maxTickOffset })
    }

    const nextQ96 = minPriceQ96 + tickSizeQ96 * BigInt(tickOffset)
    onChangeQ96(nextQ96)
  })

  return {
    totalTicks,
    clampedSliderIndex,
    progress,
    isDraggingRef,
    handlePointerDown,
    handleTickValueChange,
    minPriceQ96,
    sanitizedValueQ96,
  }
}
