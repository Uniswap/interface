import { Dimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { BaseCard } from 'ui/src/components/swipeablecards/BaseCard'
import { SwipeableCardProps } from 'ui/src/components/swipeablecards/props'

const screenWidth = Dimensions.get('window').width
const panXOffsetThreshold = screenWidth / 4

/** Slop (points): horizontal swipe must exceed this before pan activates;
 * Resolves a conflict between onboarding card stack and home screen vertical list scroll. */
const PAN_ACTIVATION_SLOP_PX = 2

export function SwipeableCard({
  children,
  stackIndex,
  cardHeight,
  activeCardHeight,
  disableSwipe,
  onPress,
  onSwiped,
  onLayout,
}: SwipeableCardProps): JSX.Element {
  const panOffset = useSharedValue(0)
  const pan = Gesture.Pan()
    .enabled(!disableSwipe)
    .activeOffsetX([-PAN_ACTIVATION_SLOP_PX, PAN_ACTIVATION_SLOP_PX])
    .failOffsetY([-PAN_ACTIVATION_SLOP_PX, PAN_ACTIVATION_SLOP_PX])
    .onChange((event) => {
      panOffset.value = event.translationX
    })
    .onFinalize((event) => {
      const { translationX } = event
      const shouldDismissCard = Math.abs(translationX) > panXOffsetThreshold

      if (shouldDismissCard) {
        panOffset.value = withSpring((translationX < 0 ? -1 : 1) * screenWidth, undefined, () => scheduleOnRN(onSwiped))
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
      <BaseCard
        panOffset={panOffset}
        stackIndex={stackIndex}
        cardHeight={cardHeight}
        activeCardHeight={activeCardHeight}
        onLayout={onLayout}
      >
        {children}
      </BaseCard>
    </GestureDetector>
  )
}
