import { Dimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { BaseCard } from 'ui/src/components/swipeablecards/BaseCard'
import { SwipeableCardProps } from 'ui/src/components/swipeablecards/props'

const screenWidth = Dimensions.get('window').width
const panXOffsetThreshold = screenWidth / 4

export function SwipeableCard({
  children,
  stackIndex,
  cardHeight,
  disableSwipe,
  onPress,
  onSwiped,
  onLayout,
}: SwipeableCardProps): JSX.Element {
  const panOffset = useSharedValue(0)
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

  const tap = Gesture.Tap()
    .enabled(!!onPress)
    .runOnJS(true)
    .onEnd(() => {
      onPress?.()
    })
  const composed = Gesture.Race(pan, tap)

  return (
    <GestureDetector gesture={composed}>
      <BaseCard panOffset={panOffset} stackIndex={stackIndex} cardHeight={cardHeight} onLayout={onLayout}>
        {children}
      </BaseCard>
    </GestureDetector>
  )
}
