import { createBox } from '@shopify/restyle'
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import React, { ComponentProps, PropsWithChildren, useCallback, useMemo } from 'react'
import { GestureResponderEvent, TouchableOpacity, TouchableOpacityProps } from 'react-native'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { withAnimated } from 'src/components/animated'
import { TraceEvent } from 'src/components/telemetry/TraceEvent'
import { ReactNativeEvent } from 'src/features/telemetry/constants'
import { TelemetryEventProps } from 'src/features/telemetry/types'
import { defaultHitslopInset } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

const TouchableBox = createBox<Theme, TouchableOpacityProps>(TouchableOpacity)
const AnimatedTouchableBox = withAnimated(TouchableBox)

const ScaleTimingConfigIn = { duration: 50, easing: Easing.ease }
const ScaleTimingConfigOut = { duration: 75, easing: Easing.ease }

export type BaseButtonProps = PropsWithChildren<
  ComponentProps<typeof TouchableBox> & {
    hapticFeedback?: boolean
    hapticStyle?: ImpactFeedbackStyle
    scaleTo?: number
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
  scaleTo,
  onPress,
  children,
  name: elementName,
  eventName,
  events,
  properties,
  activeOpacity = 0.75,
  ...rest
}: BaseButtonProps): JSX.Element {
  const scale = useSharedValue(1)

  const onPressHandler = useCallback(
    (event: GestureResponderEvent) => {
      if (!onPress) return

      if (hapticFeedback) {
        impactAsync(hapticStyle)
      }

      onPress(event)
    },
    [onPress, hapticFeedback, hapticStyle]
  )

  const onPressInHandler = useMemo(() => {
    if (!scaleTo) return
    return () => {
      scale.value = withTiming(scaleTo, ScaleTimingConfigIn)
    }
  }, [scale, scaleTo])

  const onPressOutHandler = useMemo(() => {
    if (!scaleTo) return
    return () => {
      scale.value = withDelay(50, withTiming(1, ScaleTimingConfigOut))
    }
  }, [scale, scaleTo])

  const baseProps: ComponentProps<typeof TouchableBox> = {
    onPress: onPressHandler,
    onPressIn: onPressInHandler,
    onPressOut: onPressOutHandler,
    activeOpacity,
    hitSlop: defaultHitslopInset,
    testID: elementName,
    ...rest,
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  })

  if (!eventName) {
    return (
      <AnimatedTouchableBox style={scaleTo ? animatedStyle : undefined} {...baseProps}>
        {children}
      </AnimatedTouchableBox>
    )
  }

  return (
    <TraceEvent
      elementName={elementName}
      eventName={eventName}
      events={[ReactNativeEvent.OnPress, ...(events || [])]}
      properties={properties}>
      <AnimatedTouchableBox {...baseProps} style={scaleTo ? animatedStyle : undefined}>
        {children}
      </AnimatedTouchableBox>
    </TraceEvent>
  )
}

export const AnimatedTouchableArea = withAnimated(TouchableArea)
