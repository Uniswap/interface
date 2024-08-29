import { useEffect, useState } from 'react'
import { Dimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { SWIPEABLE_CARD_Y_OFFSET, SwipeableCardProps } from 'ui/src/components/swipeablecards/props'

const screenWidth = Dimensions.get('window').width
const panXOffsetThreshold = screenWidth / 4

function getScale(stackIndex: number): number {
  return 1 - stackIndex * 0.025
}

export function SwipeableCard({
  children,
  stackIndex,
  cardHeight,
  disableSwipe,
  onSwiped,
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

  const pan = Gesture.Pan()
    .enabled(!disableSwipe)
    .onChange((event) => {
      panOffset.value = event.translationX
    })
    .onFinalize((event) => {
      const { translationX } = event
      const shouldDismissCard = Math.abs(translationX) > panXOffsetThreshold

      if (shouldDismissCard) {
        panOffset.value = withSpring(
          (translationX < 0 ? -1 : 1) * screenWidth,
          { restDisplacementThreshold: screenWidth / 5, restSpeedThreshold: 100 },
          () => runOnJS(onSwiped)(),
        )
      } else {
        panOffset.value = withTiming(0)
      }
    })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: panOffset.value }, { translateY: yOffset.value }, { scale: scale.value }],
    }
  })
  return (
    <GestureDetector gesture={pan}>
      <AnimatedFlex
        minHeight={cardHeight ? cardHeight : undefined}
        style={animatedStyle}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      >
        {children}
      </AnimatedFlex>
    </GestureDetector>
  )
}
