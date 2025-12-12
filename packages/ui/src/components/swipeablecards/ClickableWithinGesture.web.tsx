import type { GestureResponderEvent } from 'react-native'
import { ClickableWithinGestureProps } from 'ui/src/components/swipeablecards/props'
import { TouchableArea } from 'ui/src/components/touchable'

export function ClickableWithinGesture({ onPress, children }: ClickableWithinGestureProps): JSX.Element {
  const onCloseWithPropagationStop = (e: GestureResponderEvent): void => {
    e.stopPropagation()
    onPress?.()
  }

  return (
    <TouchableArea flex={1} flexGrow={1} onPress={onCloseWithPropagationStop}>
      {children}
    </TouchableArea>
  )
}
