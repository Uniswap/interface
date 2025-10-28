import { PropsWithChildren, useEffect, useState } from 'react'
import { SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'

export const SWIPEABLE_CARD_Y_OFFSET = 8

function getScale(stackIndex: number): number {
  return 1 - stackIndex * 0.025
}

type BaseCardProps = PropsWithChildren<{
  stackIndex: number
  cardHeight: number
  onLayout: ({ height, yOffset }: { height: number; yOffset: number }) => void
  panOffset?: SharedValue<number>
}>

export function BaseCard({ children, stackIndex, cardHeight, onLayout, panOffset }: BaseCardProps): JSX.Element {
  const initialYOffset = stackIndex * SWIPEABLE_CARD_Y_OFFSET
  const initialScale = getScale(stackIndex)

  const yOffset = useSharedValue(initialYOffset)
  const scale = useSharedValue(initialScale)

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
    if (panOffset) {
      panOffset.value = 0
    }
  }, [panOffset, stackIndex])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: panOffset?.value ?? 0 }, { translateY: yOffset.value }, { scale: scale.value }],
    }
  }, [panOffset, scale, yOffset])

  return (
    <AnimatedFlex
      minHeight={cardHeight ? cardHeight : undefined}
      style={animatedStyle}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
    >
      {children}
    </AnimatedFlex>
  )
}
