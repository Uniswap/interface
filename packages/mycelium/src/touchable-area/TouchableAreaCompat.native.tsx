import * as React from 'react'
import {
  type GestureResponderEvent,
  type Insets,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native'
import { touchableAreaCompatClassName } from './compile'
import type { TouchableAreaCompatProps } from './props'

/**
 * Native rendering of TouchableAreaCompat: real `Pressable` semantics — press
 * dispatch (with the legacy stop-propagation gating), long press, disabled
 * gating, auto hit-slop and minimum touch-target measurement, and the
 * press-state scale/opacity feedback (`scaleTo`/`activeOpacity`).
 *
 * Style parity on native is INFRA-2353 (uniwind resolves the compiled
 * className on Metro); until that lands the compiled className is attached
 * for the resolver and `style` passes through. The native style-parity tests
 * are written skipped and annotated INFRA-2353.
 */

/** Legacy `useAutoHitSlop` minimums (Apple HIG / Material). */
const MIN_TOUCH_TARGET = Platform.OS === 'ios' ? 44 : 48
/** Legacy `useAutoDimensions` native minimum. */
const MIN_DIMENSION = 40
/** Legacy press defaults (CustomButtonFrame `commonPressStyle` + `activeOpacity`). */
const PRESS_SCALE = 0.98
const DEFAULT_ACTIVE_OPACITY = 0.75

function autoHitSlop(width: number, height: number): Insets | undefined {
  const additionalWidth = width < MIN_TOUCH_TARGET ? MIN_TOUCH_TARGET - width : 0
  const additionalHeight = height < MIN_TOUCH_TARGET ? MIN_TOUCH_TARGET - height : 0
  if (additionalWidth === 0 && additionalHeight === 0) {
    return undefined
  }
  return {
    top: additionalHeight / 2,
    right: additionalWidth / 2,
    bottom: additionalHeight / 2,
    left: additionalWidth / 2,
  }
}

export const TouchableAreaCompat = React.forwardRef<View, TouchableAreaCompatProps>(
  function TouchableAreaCompat(props, ref) {
    const {
      children,
      disabled,
      hitSlop,
      scaleTo,
      activeOpacity = DEFAULT_ACTIVE_OPACITY,
      shouldConsiderMinimumDimensions = false,
      shouldStopPropagation = true,
      onPress,
      onPressIn,
      onPressOut,
      onLongPress,
      onLayout,
      testID,
      style,
    } = props

    const [measured, setMeasured] = React.useState<{ width: number; height: number } | undefined>(undefined)

    const handleLayout = React.useCallback(
      (event: LayoutChangeEvent): void => {
        onLayout?.(event as never)
        const { width, height } = event.nativeEvent.layout
        setMeasured((previous) =>
          previous?.width === width && previous.height === height ? previous : { width, height },
        )
      },
      [onLayout],
    )

    // The shared prop contract types the press family with web (DOM) events;
    // on native the same handlers receive gesture-responder events, exactly
    // like the legacy component's RN typing.
    const asNativeHandler = (handler: unknown): ((event: GestureResponderEvent) => void) | null | undefined =>
      handler as ((event: GestureResponderEvent) => void) | null | undefined

    const gated = (
      handler: ((event: GestureResponderEvent) => void) | null | undefined,
    ): ((event: GestureResponderEvent) => void) | undefined => {
      if (handler === null || handler === undefined) {
        return undefined
      }
      return (event: GestureResponderEvent): void => {
        if (shouldStopPropagation && typeof event.stopPropagation === 'function') {
          event.stopPropagation()
        }
        handler(event)
      }
    }

    // An explicit call-site null disables touch expansion entirely (in the
    // legacy component the user prop overrides the auto-computed insets);
    // only an absent prop falls through to the auto hit-slop measurement.
    const resolvedHitSlop =
      hitSlop === null
        ? undefined
        : hitSlop !== undefined
          ? (hitSlop as number | Insets)
          : measured !== undefined
            ? autoHitSlop(measured.width, measured.height)
            : undefined

    const minDimensionStyle: ViewStyle | undefined =
      shouldConsiderMinimumDimensions && measured !== undefined
        ? {
            width: Math.round(measured.width) <= MIN_DIMENSION ? MIN_DIMENSION : undefined,
            height: Math.round(measured.height) <= MIN_DIMENSION ? MIN_DIMENSION : undefined,
          }
        : undefined

    const pressedStyle: ViewStyle = {
      opacity: activeOpacity ? activeOpacity : undefined,
      // Truthiness on purpose: the legacy wrapper ignores scaleTo={0}.
      transform: [{ scale: scaleTo ? scaleTo : PRESS_SCALE }],
    }

    const composedStyle = ({ pressed }: { pressed: boolean }): StyleProp<ViewStyle> => [
      minDimensionStyle,
      pressed && !disabled ? pressedStyle : undefined,
      style as StyleProp<ViewStyle>,
    ]

    return (
      <Pressable
        ref={ref}
        accessibilityRole={(props.accessibilityRole as 'button' | undefined) ?? 'button'}
        accessibilityState={disabled ? { disabled: true } : undefined}
        disabled={disabled}
        hitSlop={resolvedHitSlop}
        testID={testID}
        onLayout={handleLayout}
        onPress={gated(asNativeHandler(onPress))}
        onPressIn={gated(asNativeHandler(onPressIn))}
        onPressOut={gated(asNativeHandler(onPressOut))}
        // Un-gated like the legacy component (only the press/pressIn/pressOut
        // trio gets the stop-propagation wrapper there) and like the web split.
        onLongPress={asNativeHandler(onLongPress) ?? undefined}
        style={composedStyle}
        // uniwind resolves the compiled className on Metro — INFRA-2353.
        {...{ className: touchableAreaCompatClassName(props) }}
      >
        {children}
      </Pressable>
    )
  },
)
