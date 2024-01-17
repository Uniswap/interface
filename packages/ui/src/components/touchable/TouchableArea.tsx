import { impactAsync } from 'expo-haptics'
import { useCallback, useMemo, useRef } from 'react'
import { GestureResponderEvent } from 'react-native'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { usePropsAndStyle } from 'tamagui'
import { withAnimated } from 'ui/src/components/factories/animated'
import { AnimatedTouchableBox, TouchableBoxProps } from 'ui/src/components/touchable/TouchableBox'
import { TouchableAreaProps } from 'ui/src/components/touchable/types'
import { defaultHitslopInset } from 'ui/src/theme'

const ScaleTimingConfigIn = { duration: 50, easing: Easing.ease }
const ScaleTimingConfigOut = { duration: 75, easing: Easing.ease }

/**
 * This component wraps children in a TouchableBox. If you are trying to implement a standard button DO NOT USE this component. Use the Button component instead with the desired size and emphasis.
 * Examples of when to use this are:
 *  - clickable text
 *  - clickable icons (different from an icon button which has a bg color, border radius, and a border)
 *  - custom elements that are clickable (e.g. rows, cards, headers)
 */
export function TouchableArea({
  hapticFeedback = false,
  ignoreDragEvents = false,
  hapticStyle,
  scaleTo,
  onPress,
  children,
  testID,
  activeOpacity = 0.75,
  hitSlop,
  disabled,
  ...propsIn
}: TouchableAreaProps): JSX.Element {
  const [rest, style] = usePropsAndStyle(propsIn)

  const touchActivationPositionRef = useRef<Pick<
    GestureResponderEvent['nativeEvent'],
    'pageX' | 'pageY'
  > | null>(null)

  const scale = useSharedValue(1)

  const onPressHandler = useCallback(
    async (event: GestureResponderEvent) => {
      if (!onPress) {
        return
      }

      if (!ignoreDragEvents) {
        const { pageX, pageY } = event.nativeEvent

        const isDragEvent =
          touchActivationPositionRef.current &&
          isDrag(
            touchActivationPositionRef.current.pageX,
            touchActivationPositionRef.current.pageY,
            pageX,
            pageY
          )

        if (isDragEvent) {
          return
        }
      }

      onPress(event)

      if (hapticFeedback) {
        await impactAsync(hapticStyle)
      }
    },
    [onPress, ignoreDragEvents, hapticFeedback, hapticStyle]
  )

  const onPressInHandler = useMemo(() => {
    return ({ nativeEvent: { pageX, pageY } }: GestureResponderEvent) => {
      touchActivationPositionRef.current = { pageX, pageY }

      if (!scaleTo) {
        return
      }
      scale.value = withTiming(scaleTo, ScaleTimingConfigIn)
    }
  }, [scale, scaleTo])

  const onPressOutHandler = useMemo(() => {
    if (!scaleTo) {
      return
    }
    return () => {
      scale.value = withDelay(50, withTiming(1, ScaleTimingConfigOut))
    }
  }, [scale, scaleTo])

  const { onLongPress, ...restStyles } = rest

  const baseProps: TouchableBoxProps = {
    onPress: onPressHandler,
    onPressIn: onPressInHandler,
    onPressOut: onPressOutHandler,
    onLongPress,
    activeOpacity,
    hitSlop: hitSlop || defaultHitslopInset,
    testID,
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  })

  return (
    <AnimatedTouchableBox
      {...baseProps}
      disabled={disabled}
      style={[scaleTo ? animatedStyle : null, style, restStyles]}>
      {children}
    </AnimatedTouchableBox>
  )
}

export const AnimatedTouchableArea = withAnimated(TouchableArea)

/**
 * @link https://github.com/satya164/react-native-tab-view/issues/1241#issuecomment-1022400366
 * @returns true if press was after a drag gesture
 */
function isDrag(
  activationX: number,
  activationY: number,
  releaseX: number,
  releaseY: number,
  threshold = 2
): boolean {
  const absX = Math.abs(activationX - releaseX)
  const absY = Math.abs(activationY - releaseY)

  const dragged = absX > threshold || absY > threshold

  return dragged
}
