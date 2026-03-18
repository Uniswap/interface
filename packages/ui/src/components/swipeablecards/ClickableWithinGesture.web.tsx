import type { GestureResponderEvent } from 'react-native'
import { ClickableWithinGestureProps } from 'ui/src/components/swipeablecards/props'
import { TouchableArea } from 'ui/src/components/touchable'

export function ClickableWithinGesture({ onPress, children }: ClickableWithinGestureProps): JSX.Element {
  const onPressWithPropagationStop = (e: GestureResponderEvent): void => {
    e.stopPropagation()
    onPress?.()
  }

  return (
    <TouchableArea
      flex={1}
      flexGrow={1}
      // Disable press animations (scale/opacity) to prevent the element from moving
      // during click, which can cause nested clickable elements to shift away from cursor
      activeOpacity={1}
      pressStyle={{ scale: 1 }}
      onPress={onPressWithPropagationStop}
    >
      {children}
    </TouchableArea>
  )
}
