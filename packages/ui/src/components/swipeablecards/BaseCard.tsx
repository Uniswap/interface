import { AnimatedFlex } from '@universe/mycelium'
import { PropsWithChildren, useEffect, useState } from 'react'
import { type SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'ui/src/animations'

export const SWIPEABLE_CARD_Y_OFFSET = 8
const SCALE_FACTOR = 0.025

// Anchor scale at the bottom edge so it stays put while the card shrinks — keeps the peek deterministic across platforms.
// Module-scoped static style, never part of the worklet: a string transformOrigin inside the animated style throws
// `undefined is not a function` at mount on Android over the plain-View AnimatedFlex base.
const SCALE_ANCHOR_STYLE = { transformOrigin: 'center bottom' } as const

function getScale(stackIndex: number): number {
  return 1 - stackIndex * SCALE_FACTOR
}

// Bottom-anchored: places each behind card's bottom edge stackIndex*8 below the active card's bottom.
// Scale is anchored at the bottom (transformOrigin in BaseCard), so the bottom edge is scale-invariant — no compensation needed, and the peek is identical across platforms.
function getYOffset({
  stackIndex,
  activeCardHeight,
  thisCardHeight,
}: {
  stackIndex: number
  activeCardHeight: number
  thisCardHeight: number
}): number {
  if (stackIndex === 0) {
    return 0
  }

  return activeCardHeight - thisCardHeight + stackIndex * SWIPEABLE_CARD_Y_OFFSET
}

type BaseCardProps = PropsWithChildren<{
  stackIndex: number
  cardHeight: number
  activeCardHeight: number
  onLayout: ({ height, yOffset }: { height: number; yOffset: number }) => void
  panOffset?: SharedValue<number>
}>

export function BaseCard({
  children,
  stackIndex,
  cardHeight,
  activeCardHeight,
  onLayout,
  panOffset,
}: BaseCardProps): JSX.Element {
  const [height, setHeight] = useState(cardHeight)

  const initialYOffset = getYOffset({ stackIndex, activeCardHeight, thisCardHeight: height })
  const initialScale = getScale(stackIndex)

  const yOffset = useSharedValue(initialYOffset)
  const scale = useSharedValue(initialScale)

  const [targetYOffset, setTargetYOffset] = useState(initialYOffset)

  useEffect(() => {
    onLayout({ height, yOffset: targetYOffset })
  }, [height, onLayout, targetYOffset])

  useEffect(() => {
    const nextYOffset = getYOffset({ stackIndex, activeCardHeight, thisCardHeight: height })

    setTargetYOffset(nextYOffset)
    yOffset.value = withSpring(nextYOffset)
    scale.value = withSpring(getScale(stackIndex))
    if (panOffset) {
      panOffset.value = 0
    }
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [panOffset, stackIndex, activeCardHeight, height])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: panOffset?.value ?? 0 }, { translateY: yOffset.value }, { scale: scale.value }],
    }
  }, [panOffset, scale, yOffset])

  // Only apply minHeight to active card to prevent layout shift
  // Behind cards should render at natural height for accurate measurement
  const isActiveCard = stackIndex === 0
  const minHeightValue = isActiveCard && cardHeight ? cardHeight : undefined

  return (
    <AnimatedFlex
      minHeight={minHeightValue}
      style={[SCALE_ANCHOR_STYLE, animatedStyle]}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
    >
      {children}
    </AnimatedFlex>
  )
}
