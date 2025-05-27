import { forwardRef, useCallback, useMemo, useRef } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { YStack, type TamaguiElement, type YStackProps } from 'tamagui'
import { withAnimated } from 'ui/src/components/factories/animated'
import type { TouchableAreaProps } from 'ui/src/components/touchable/types'
import { defaultHitslopInset } from 'ui/src/theme'
import { isTestEnv } from 'utilities/src/environment/env'

export type TouchableAreaEvent = GestureResponderEvent

// TODO(MOB-2826): tests are picking up weird animationStyle on snapshots...
const animationProps: Partial<YStackProps> = isTestEnv()
  ? {}
  : {
      animation: 'simple',
      animateOnly: ['transform', 'opacity'],
    }

/**
 * If you are trying to implement a standard button DO NOT USE this component. Use the Button component instead with the desired size and emphasis.
 * Examples of when to use this are:
 *  - clickable text
 *  - clickable icons (different from an icon button which has a bg color, border radius, and a border)
 *  - custom elements that are clickable (e.g. rows, cards, headers)
 */
export const TouchableArea = forwardRef<TamaguiElement, TouchableAreaProps>(function TouchableArea(
  {
    ignoreDragEvents = false,
    scaleTo,
    onPress,
    children,
    hoverable = true,
    activeOpacity = 0.75,
    pressStyle: pressStyleProp,
    hoverStyle: hoverStyleProp,
    ...restProps
  },
  ref,
): JSX.Element {
  const touchActivationPositionRef = useRef<Pick<GestureResponderEvent['nativeEvent'], 'pageX' | 'pageY'> | null>(null)

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
          isDrag(touchActivationPositionRef.current.pageX, touchActivationPositionRef.current.pageY, pageX, pageY)

        if (isDragEvent) {
          return
        }
      }

      onPress(event)
    },
    [onPress, ignoreDragEvents],
  )

  const onPressInHandler = useMemo(() => {
    return ({ nativeEvent: { pageX, pageY } }: GestureResponderEvent) => {
      touchActivationPositionRef.current = { pageX, pageY }
    }
  }, [])

  const pressStyle: YStackProps['pressStyle'] = useMemo(() => {
    return {
      opacity: activeOpacity,
      scale: scaleTo ?? 1,
      ...pressStyleProp,
    }
  }, [activeOpacity, scaleTo, pressStyleProp])

  const hoverStyle: YStackProps['hoverStyle'] = useMemo(() => {
    if (!hoverable || !hoverStyleProp) {
      return {}
    }

    return {
      backgroundColor: '$backgroundHover',
      ...hoverStyleProp,
    }
  }, [hoverable, hoverStyleProp])

  return (
    <YStack
      ref={ref}
      {...animationProps}
      cursor="pointer"
      hitSlop={defaultHitslopInset}
      {...restProps}
      pressStyle={pressStyle}
      hoverStyle={hoverStyle}
      onPress={onPressHandler}
      onPressIn={onPressInHandler}
    >
      {children}
    </YStack>
  )
})

export const AnimatedTouchableArea = withAnimated(TouchableArea)

/**
 * @link https://github.com/satya164/react-native-tab-view/issues/1241#issuecomment-1022400366
 * @returns true if press was after a drag gesture
 */
function isDrag(activationX: number, activationY: number, releaseX: number, releaseY: number, threshold = 2): boolean {
  const absX = Math.abs(activationX - releaseX)
  const absY = Math.abs(activationY - releaseY)

  const dragged = absX > threshold || absY > threshold

  return dragged
}
