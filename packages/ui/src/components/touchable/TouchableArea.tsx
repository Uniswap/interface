import { impactAsync } from 'expo-haptics'
import { forwardRef, useCallback, useMemo, useRef } from 'react'
import { GestureResponderEvent } from 'react-native'
import { TamaguiElement, YStack, isWeb } from 'tamagui'
import { withAnimated } from 'ui/src/components/factories/animated'
import { TouchableAreaProps } from 'ui/src/components/touchable/types'
import { defaultHitslopInset } from 'ui/src/theme'

/**
 * If you are trying to implement a standard button DO NOT USE this component. Use the Button component instead with the desired size and emphasis.
 * Examples of when to use this are:
 *  - clickable text
 *  - clickable icons (different from an icon button which has a bg color, border radius, and a border)
 *  - custom elements that are clickable (e.g. rows, cards, headers)
 */
export const TouchableArea = forwardRef<TamaguiElement, TouchableAreaProps>(function TouchableArea(
  {
    hapticFeedback = false,
    ignoreDragEvents = false,
    hapticStyle,
    scaleTo,
    onPress,
    children,
    hoverable,
    activeOpacity = 0.75,
    ...restProps
  },
  ref
): JSX.Element {
  const touchActivationPositionRef = useRef<Pick<
    GestureResponderEvent['nativeEvent'],
    'pageX' | 'pageY'
  > | null>(null)

  const onPressHandler = useCallback(
    async (event: GestureResponderEvent) => {
      if (!onPress) {
        return
      }

      // TODO: MOB-2756 we potentially may not need ignoreDragEvents logic
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

      if (hapticFeedback && !isWeb) {
        await impactAsync(hapticStyle)
      }
    },
    [onPress, ignoreDragEvents, hapticFeedback, hapticStyle]
  )

  const onPressInHandler = useMemo(() => {
    return ({ nativeEvent: { pageX, pageY } }: GestureResponderEvent) => {
      touchActivationPositionRef.current = { pageX, pageY }
    }
  }, [])

  return (
    <YStack
      ref={ref}
      // TODO(MOB-2826): tests are picking up weird animationStyle on snapshots...
      {...(process.env.NODE_ENV !== 'test' && {
        animation: '100ms',
        // TODO(MOB-3059): fixes crash caused by animating shadowOffset, should be fixed in tamagui
        animateOnly: ['transform', 'opacity'],
      })}
      cursor="pointer"
      hitSlop={defaultHitslopInset}
      {...restProps}
      pressStyle={{
        opacity: activeOpacity,
        scale: scaleTo ?? 1,
        ...restProps.pressStyle,
      }}
      {...(hoverable && {
        hoverStyle: {
          backgroundColor: '$backgroundHover',
          ...restProps.hoverStyle,
        },
      })}
      onPress={onPressHandler}
      onPressIn={onPressInHandler}>
      {children}
    </YStack>
  )
})

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
