import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { ClickableWithinGestureProps } from 'ui/src/components/swipeablecards/props'

export function ClickableWithinGesture({ onPress, children }: ClickableWithinGestureProps): JSX.Element {
  const tap = Gesture.Tap()
    .enabled(!!onPress)
    .runOnJS(true)
    .onEnd(() => {
      onPress?.()
    })

  return <GestureDetector gesture={tap}>{children}</GestureDetector>
}
