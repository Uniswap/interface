import { PropsWithChildren, useEffect, useState } from 'react'
import { type SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'ui/src/animations'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'

export const SWIPEABLE_CARD_Y_OFFSET = 8
const SCALE_FACTOR = 0.025

function getScale(stackIndex: number): number {
  return 1 - stackIndex * SCALE_FACTOR
}

// Bottom-anchored Y offset calculation
// Positions behind cards so their bottom edges peek below the front card
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
  } // Top card at y=0

  // Base offset to position bottom edge (stackIndex * 8) below active card's bottom
  const baseOffset = activeCardHeight - thisCardHeight + stackIndex * SWIPEABLE_CARD_Y_OFFSET

  // Compensate for scale transformation shrinking the card from its center
  // Scale shifts the bottom edge up by: thisCardHeight * (1 - scale) / 2
  // Since scale = 1 - stackIndex * SCALE_FACTOR, we get: thisCardHeight * stackIndex * SCALE_FACTOR / 2
  const scaleCompensation = (thisCardHeight * stackIndex * SCALE_FACTOR) / 2

  return baseOffset + scaleCompensation
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
      style={animatedStyle}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
    >
      {children}
    </AnimatedFlex>
  )
}
