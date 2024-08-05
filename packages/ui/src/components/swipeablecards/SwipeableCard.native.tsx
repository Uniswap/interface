import { useEffect, useState } from 'react'
import { Dimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { SwipeableCardProps } from 'ui/src/components/swipeablecards/props'

const screenWidth = Dimensions.get('window').width
const panXOffsetThreshold = screenWidth / 4

export function SwipeableCard({
  children,
  stackIndex,
  cardHeight,
  disableSwipe,
  onSwiped,
  onLayout,
}: SwipeableCardProps): JSX.Element {
  const yOffset = useSharedValue(0)
  const panOffset = useSharedValue(0)

  const [height, setHeight] = useState(0)
  const [targetYOffset, setTargetYOffset] = useState(0)

  useEffect(() => {
    onLayout({ height, yOffset: targetYOffset })
  }, [height, onLayout, targetYOffset])

  useEffect(() => {
    const nextYOffset = stackIndex * 10

    setTargetYOffset(nextYOffset)
    yOffset.value = withSpring(nextYOffset)
    panOffset.value = 0
  }, [panOffset, stackIndex, yOffset])

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
          { restDisplacementThreshold: screenWidth / 10, restSpeedThreshold: 50 },
          () => runOnJS(onSwiped)(),
        )
      } else {
        panOffset.value = withSpring(0)
      }
    })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: panOffset.value }, { translateY: yOffset.value }],
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
