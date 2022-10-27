import { createBox } from '@shopify/restyle'
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import React, { ComponentProps, PropsWithChildren, useCallback } from 'react'
import { GestureResponderEvent, TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { withAnimated } from 'src/components/animated'
import { ActionProps, ElementName } from 'src/features/telemetry/constants'
import { TraceEvent } from 'src/features/telemetry/TraceEvent'
import { defaultHitslopInset } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

const TouchableAreaActionProps = (({ onPress, onLongPress }) => ({ onPress, onLongPress }))(
  ActionProps
)

export const TouchableBox = createBox<Theme, TouchableOpacityProps>(TouchableOpacity)

export type BaseButtonProps = PropsWithChildren<
  ComponentProps<typeof TouchableBox> & {
    name?: ElementName | string
    hapticFeedback?: boolean
    hapticStyle?: ImpactFeedbackStyle
  }
>

/**
 * This component wraps children in a TouchableBox and adds tracking. If you are trying to implement a standard button DO NOT USE this component. Use the Button component instead with the desired size and emphasis.
 * Examples of when to use this are:
 *  - clickable text
 *  - clickable icons (different from an icon button which has a bg color, border radius, and a border)
 *  - custom elements that are clickable (e.g. rows, cards, headers)
 */
export function TouchableArea({
  hapticFeedback = false,
  hapticStyle,
  onPress,
  children,
  name: elementName,
  ...rest
}: BaseButtonProps) {
  const onPressHandler = useCallback(
    (event: GestureResponderEvent) => {
      if (!onPress) return

      if (hapticFeedback) {
        impactAsync(hapticStyle)
      }
      onPress(event)
    },
    [onPress, hapticStyle, hapticFeedback]
  )

  const baseProps = { onPress: onPressHandler, hitSlop: defaultHitslopInset, ...rest }

  if (!elementName) {
    return <TouchableBox {...baseProps}>{children}</TouchableBox>
  }

  return (
    <TraceEvent
      actionProps={TouchableAreaActionProps}
      elementName={elementName}
      elementType="button">
      <TouchableBox {...baseProps}>{children}</TouchableBox>
    </TraceEvent>
  )
}

export const AnimatedTouchableArea = withAnimated(TouchableArea)
