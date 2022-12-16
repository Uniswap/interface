import { createBox } from '@shopify/restyle'
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import React, { ComponentProps, PropsWithChildren, useCallback } from 'react'
import { GestureResponderEvent, TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { withAnimated } from 'src/components/animated'
import { TraceEvent } from 'src/components/telemetry/TraceEvent'
import { ReactNativeEvent } from 'src/features/telemetry/constants'
import { TelemetryEventProps } from 'src/features/telemetry/types'
import { defaultHitslopInset } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

export const TouchableBox = createBox<Theme, TouchableOpacityProps>(TouchableOpacity)

export type BaseButtonProps = PropsWithChildren<
  ComponentProps<typeof TouchableBox> & {
    hapticFeedback?: boolean
    hapticStyle?: ImpactFeedbackStyle
  } & TelemetryEventProps
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
  eventName,
  events,
  properties,
  activeOpacity = 0.75,
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

  const baseProps: ComponentProps<typeof TouchableBox> = {
    onPress: onPressHandler,
    activeOpacity,
    hitSlop: defaultHitslopInset,
    testID: elementName,
    ...rest,
  }

  if (!eventName) {
    return <TouchableBox {...baseProps}>{children}</TouchableBox>
  }

  return (
    <TraceEvent
      elementName={elementName}
      eventName={eventName}
      events={[ReactNativeEvent.OnPress, ...(events || [])]}
      properties={properties}>
      <TouchableBox {...baseProps}>{children}</TouchableBox>
    </TraceEvent>
  )
}

export const AnimatedTouchableArea = withAnimated(TouchableArea)
