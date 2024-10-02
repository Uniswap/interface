import { useEffect, useState } from 'react'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { SWIPEABLE_CARD_Y_OFFSET, SwipeableCardProps } from 'ui/src/components/swipeablecards/props'

function getScale(stackIndex: number): number {
  return 1 - stackIndex * 0.025
}

// TODO WALL-4684 - Figure out how best way to swipe functionality for web/extension
export function SwipeableCard({
  children,
  stackIndex,
  cardHeight,
  onPress,
  onLayout,
}: SwipeableCardProps): JSX.Element {
  const initialYOffset = stackIndex * SWIPEABLE_CARD_Y_OFFSET
  const initialScale = getScale(stackIndex)

  const yOffset = useSharedValue(initialYOffset)
  const scale = useSharedValue(initialScale)
  const panOffset = useSharedValue(0)

  const [height, setHeight] = useState(0)
  const [targetYOffset, setTargetYOffset] = useState(initialYOffset)

  useEffect(() => {
    onLayout({ height, yOffset: targetYOffset })
  }, [height, onLayout, targetYOffset])

  useEffect(() => {
    const nextYOffset = stackIndex * SWIPEABLE_CARD_Y_OFFSET

    setTargetYOffset(nextYOffset)
    yOffset.value = withSpring(nextYOffset)
    scale.value = withSpring(getScale(stackIndex))
    panOffset.value = 0
  }, [panOffset, scale, stackIndex, yOffset])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: panOffset.value }, { translateY: yOffset.value }, { scale: scale.value }],
      cursor: onPress ? 'pointer' : undefined,
    }
  }, [panOffset, scale, yOffset, onPress])

  return (
    <AnimatedFlex
      minHeight={cardHeight ? cardHeight : undefined}
      style={animatedStyle}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      onPress={onPress}
    >
      {children}
    </AnimatedFlex>
  )
}
