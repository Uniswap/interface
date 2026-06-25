import { useEffect, useMemo, useRef, useState } from 'react'
import type { LayoutChangeEvent, View } from 'react-native'
import { useWindowDimensions } from 'tamagui'
import type { CoachmarkProps } from 'ui/src/components/coachmark/Coachmark'
import { spacing } from 'ui/src/theme/spacing'
import { useEvent } from 'utilities/src/react/hooks'

const SCREEN_EDGE_PADDING = spacing.spacing16

export type Side = 'top' | 'bottom'

type Placement = NonNullable<CoachmarkProps['placement']>

interface TriggerLayout {
  x: number
  y: number
  width: number
  height: number
}

interface BubbleSize {
  width: number
  height: number
}

export interface AnchoredPosition {
  top: number
  left: number
  arrowLeft: number
}

export function resolveOffset(offset: CoachmarkProps['offset']): { mainAxis: number; crossAxis: number } {
  if (typeof offset === 'number') {
    return { mainAxis: offset, crossAxis: 0 }
  }
  if (offset && typeof offset === 'object') {
    const { mainAxis, crossAxis } = offset as { mainAxis?: number; crossAxis?: number }
    return { mainAxis: mainAxis ?? 0, crossAxis: crossAxis ?? 0 }
  }
  return { mainAxis: 0, crossAxis: 0 }
}

export function getSide(placement: Placement): Side {
  const [rawSide] = placement.split('-')
  return rawSide === 'top' ? 'top' : 'bottom'
}

function clamp(value: number, bounds: { min: number; max: number }): number {
  return Math.min(Math.max(value, bounds.min), Math.max(bounds.min, bounds.max))
}

interface ComputeAnchoredPositionParams {
  placement: Placement
  offset: CoachmarkProps['offset']
  triggerLayout: TriggerLayout
  bubbleSize: BubbleSize
  screenWidth: number
  beakWidth: number
}

/**
 * Pure placement math: given a measured trigger and bubble, returns where to float the bubble and
 * where to center its beak. Kept separate from the hook so it can be unit-tested without a layout.
 */
export function computeAnchoredPosition({
  placement,
  offset,
  triggerLayout,
  bubbleSize,
  screenWidth,
  beakWidth,
}: ComputeAnchoredPositionParams): AnchoredPosition {
  const [, alignment] = placement.split('-')
  const { mainAxis, crossAxis } = resolveOffset(offset)

  const top =
    getSide(placement) === 'top'
      ? triggerLayout.y - bubbleSize.height - mainAxis
      : triggerLayout.y + triggerLayout.height + mainAxis

  const rawLeft =
    alignment === 'end'
      ? triggerLayout.x + triggerLayout.width - bubbleSize.width - crossAxis
      : alignment === 'start'
        ? triggerLayout.x + crossAxis
        : triggerLayout.x + triggerLayout.width / 2 - bubbleSize.width / 2 + crossAxis
  const left = clamp(rawLeft, { min: SCREEN_EDGE_PADDING, max: screenWidth - bubbleSize.width - SCREEN_EDGE_PADDING })

  const arrowLeft = bubbleSize.width / 2 - beakWidth / 2

  return { top, left, arrowLeft }
}

interface UseAnchoredPositionParams {
  open: boolean
  placement: Placement
  offset: CoachmarkProps['offset']
  beakWidth: number
}

interface UseAnchoredPositionResult {
  triggerRef: React.RefObject<View | null>
  side: Side
  position: AnchoredPosition | null
  hasBubbleSize: boolean
  measureTrigger: () => void
  onBubbleLayout: (event: LayoutChangeEvent) => void
}

/**
 * Measures a trigger and computes where to float anchored content (and its centered beak) relative
 * to it. This is the native stand-in for the floating-ui placement Tamagui's Tooltip gives web for
 * free, and is what keeps Coachmark.native a thin trigger + bubble component.
 */
export function useAnchoredPosition({
  open,
  placement,
  offset,
  beakWidth,
}: UseAnchoredPositionParams): UseAnchoredPositionResult {
  const { width: screenWidth } = useWindowDimensions()

  const triggerRef = useRef<View>(null)
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(null)
  const [bubbleSize, setBubbleSize] = useState<BubbleSize | null>(null)

  const measureTrigger = useEvent((): void => {
    // oxlint-disable-next-line max-params
    triggerRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setTriggerLayout({ x: pageX, y: pageY, width, height })
    })
  })

  const onBubbleLayout = useEvent((event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout
    setBubbleSize({ width, height })
  })

  useEffect(() => {
    if (open) {
      measureTrigger()
    } else {
      setTriggerLayout(null)
      setBubbleSize(null)
    }
  }, [open, measureTrigger])

  const position = useMemo<AnchoredPosition | null>(() => {
    if (!triggerLayout || !bubbleSize) {
      return null
    }
    return computeAnchoredPosition({ placement, offset, triggerLayout, bubbleSize, screenWidth, beakWidth })
  }, [placement, offset, triggerLayout, bubbleSize, screenWidth, beakWidth])

  return {
    triggerRef,
    side: getSide(placement),
    position,
    hasBubbleSize: bubbleSize !== null,
    measureTrigger,
    onBubbleLayout,
  }
}
