/**
 * NATIVE leg of `ButtonFrameCompat` (INFRA-3315), transcribed from the proven
 * `../button-compat/ButtonCompat.native.tsx` frame machinery:
 *
 *  - HOVER/PRESS ARE REACT STATE, NOT `hover:`/`active:` classes — uniwind
 *    1.7.0 drops unrecognized variants in silence, so the scoped cells are
 *    selected by boolean (`buttonCompatNativeFrameClassName`);
 *  - press scale is `withSporeCurve('fast', …)` (legacy native animates the
 *    same spring);
 *  - the OPEN legacy style-prop surface rides BOTH lanes, the
 *    `FlexCompat.native` doctrine: the raw composed className (uniwind
 *    resolves semantic/enum utilities on Metro) plus an RN style object for
 *    the runtime-interpolated families uniwind's static scanner can never
 *    see, with dropped-prop dev warnings;
 *  - `focusScaling` is accepted and emits nothing (no native focus ring), and
 *    `tag`/`href` are ignored like every native compat leg.
 *
 * The context broadcasts `hovered`/`pressed` so the rebuilt label/icon can
 * repaint on frame interaction (the legacy `$group-item-hover` read-back).
 */
import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
import { forwardRef, useCallback, useEffect, useMemo, useState, type JSX } from 'react'
import { I18nManager, View } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useResolveClassNames } from 'uniwind'
import { noop } from 'utilities/src/react/noop'
import {
  buttonCompatNativeFrameClassName,
  getContrastTextClass,
  type ButtonIconPosition,
} from '../button-compat/compile'
import { PRESS_SCALE } from '../button-compat/press-scale'
import { cn } from '../cn'
import { warnUnsupportedNativeProps } from '../compat/native-diagnostics'
import { nativeCompatProps } from '../compat/native-props'
import { compatNativeStyle, type CompatNativeStyle } from '../compat/native-style'
import {
  buttonFrameOpenClassName,
  type ButtonFrameContextValue,
  type ButtonFrameOpenProps,
  type ButtonFrameStyleProps,
} from './compile'
import { ButtonFrameContextProvider } from './context'
import { getMaybeHexOrRgbColor } from './custom-color'
import type { ButtonFrameCompatProps, ButtonFramePressHandler } from './native-props'

export type { ButtonFrameCompatProps } from './native-props'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/** Legacy getIconPosition RTL swap — kept, matching `../button-compat`'s measured behavior. */
function resolveIconPosition(iconPosition: ButtonIconPosition): ButtonIconPosition {
  if (!I18nManager.isRTL) {
    return iconPosition
  }
  return iconPosition === 'before' ? 'after' : 'before'
}

/** The style-object families `compat/native-style` resolves for RN. */
function nativeStyleLane({
  open,
  pressed,
  hovered,
}: {
  open: ButtonFrameOpenProps
  pressed: boolean
  hovered: boolean
}): CompatNativeStyle {
  const { hoverStyle, pressStyle, ...base } = open as ButtonFrameStyleProps & {
    hoverStyle?: ButtonFrameStyleProps
    pressStyle?: ButtonFrameStyleProps
  }
  const merged: ButtonFrameStyleProps = {
    ...base,
    ...(hovered ? hoverStyle : undefined),
    ...(pressed ? pressStyle : undefined),
  }
  const { style, dropped } = compatNativeStyle(merged)
  warnUnsupportedNativeProps('ButtonFrameCompat', dropped)
  return style
}

/** Chain the frame's internal state handler with a caller's own (internal first, like web's mapRnHandlers). */
function chainHandlers<E>(internal: (event: E) => void, caller: unknown): (event: E) => void {
  if (typeof caller !== 'function') {
    return internal
  }
  return (event: E): void => {
    internal(event)
    ;(caller as (event: E) => void)(event)
  }
}

type NativePressEvent = Parameters<ButtonFramePressHandler>[0]

/** What this leg actually dispatches: RNGH's event plus the two shimmed methods. */
type ShimmedPressEvent = NativePressEvent & { stopPropagation: () => void; preventDefault: () => void }

/**
 * RNGH's Pressable dispatches its own `PressableEvent` (`{ nativeEvent }`), but
 * the compat press props type the native arm as `GestureResponderEvent`
 * (`../compat/props.ts`), and the Tamagui frame this leg replaced really did
 * deliver one — Tamagui routes native presses through RN's `Pressability`. So
 * shared callers write `event.stopPropagation()`, typecheck green, and crash on
 * device. Re-add the two methods they reach for, as no-ops — which is what they
 * already were on native, where the responder system does not bubble presses.
 *
 * TRADEOFF: this narrows the type lie, it does not end it — a caller reaching
 * past these two still breaks. Remove once the press props are typed against
 * RNGH's event the way `../button-compat/press-handler.ts` does.
 */
function shimPressEvent(caller: unknown): ButtonFramePressHandler | undefined {
  if (typeof caller !== 'function') {
    return undefined
  }
  const handler = caller as (event: ShimmedPressEvent) => void
  return (event: NativePressEvent): void => handler({ ...event, stopPropagation: noop, preventDefault: noop })
}

export const ButtonFrameCompat = forwardRef<View, ButtonFrameCompatProps>(
  function ButtonFrameCompat(props, ref): JSX.Element {
    const {
      size = 'medium',
      variant = 'default',
      emphasis = 'primary',
      fill = true,
      focusScaling: _focusScaling = 'default',
      iconPosition = 'before',
      isDisabled = false,
      onDisabledPress,
      'custom-background-color': customBackgroundColorProp,
      'primary-color': _primaryColor,
      'dd-action-name': ddActionName,
      backgroundColor,
      onPress,
      disabled,
      testID,
      className,
      style,
      children,
      ...open
    } = props

    const customBackgroundColor = getMaybeHexOrRgbColor(backgroundColor)
    const tokenBackgroundColor = customBackgroundColor === undefined ? backgroundColor : undefined

    const [hovered, setHovered] = useState(false)
    const [pressed, setPressed] = useState(false)

    const scale = useSharedValue(1)
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale])

    const interactiveWhileDisabled = Boolean(onDisabledPress)
    const blocked = (disabled ?? (isDisabled && !interactiveWhileDisabled)) === true

    // Clear press/hover artifacts when the button stops DISPATCHING — keyed on
    // `blocked` (what actually disables the Pressable), not `isDisabled`: an
    // explicit `disabled` prop alone must still reset (no *Out event will ever
    // arrive), while isDisabled + onDisabledPress keeps dispatching and must
    // NOT lose live hover state.
    useEffect(() => {
      if (blocked) {
        setHovered(false)
        setPressed(false)
        scale.value = withSporeCurve('fast', 1)
      }
    }, [blocked, scale])

    const handlePressIn = useCallback(() => {
      setPressed(true)
      scale.value = withSporeCurve('fast', PRESS_SCALE)
    }, [scale])

    const handlePressOut = useCallback(() => {
      setPressed(false)
      scale.value = withSporeCurve('fast', 1)
    }, [scale])

    const handleHoverIn = useCallback(() => {
      if (blocked) {
        return
      }
      setHovered(true)
    }, [blocked])

    const handleHoverOut = useCallback(() => setHovered(false), [])

    const contextCustomBackground = getMaybeHexOrRgbColor(customBackgroundColorProp) ?? customBackgroundColor

    const ctx: ButtonFrameContextValue = useMemo(
      () => ({
        size,
        variant,
        emphasis,
        isDisabled,
        customBackgroundColor: contextCustomBackground,
        customTextClass: contextCustomBackground ? getContrastTextClass(contextCustomBackground) : undefined,
        hovered,
        pressed,
      }),
      [size, variant, emphasis, isDisabled, contextCustomBackground, hovered, pressed],
    )

    const closedClassName = buttonCompatNativeFrameClassName({
      size,
      iconPosition: resolveIconPosition(iconPosition),
      fill,
      variant,
      emphasis,
      disabled: isDisabled,
      onDisabledPress,
      backgroundColor: customBackgroundColor,
      hovered,
      pressed,
    })

    const openForLanes = { ...open, backgroundColor: tokenBackgroundColor } as ButtonFrameOpenProps
    const openClassName = buttonFrameOpenClassName(openForLanes)
    const openStyle = nativeStyleLane({ open: openForLanes, pressed, hovered })

    const frameClassName = cn(closedClassName, openClassName, className)
    // RNGH's Pressable silently drops className (see ../button-compat's native
    // leg) — resolve it here and paint through style.
    const frameClassStyle = useResolveClassNames(frameClassName)

    return (
      <ButtonFrameContextProvider value={ctx}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isDisabled || undefined }}
          {...nativeCompatProps(open as Parameters<typeof nativeCompatProps>[0])}
          dd-action-name={ddActionName}
          disabled={blocked}
          // Callers' RN handlers compose AFTER the internal state handlers —
          // web remaps the same pairs onto their DOM seams (mapRnHandlers),
          // so a caller's onPressIn/onHoverIn must fire on native too.
          onHoverIn={chainHandlers(handleHoverIn, (open as Record<string, unknown>)['onHoverIn'])}
          onHoverOut={chainHandlers(handleHoverOut, (open as Record<string, unknown>)['onHoverOut'])}
          onLongPress={shimPressEvent((open as Record<string, unknown>)['onLongPress']) as never}
          onPress={blocked ? undefined : shimPressEvent(onPress)}
          onPressIn={chainHandlers(handlePressIn, shimPressEvent((open as Record<string, unknown>)['onPressIn']))}
          onPressOut={chainHandlers(handlePressOut, shimPressEvent((open as Record<string, unknown>)['onPressOut']))}
          ref={ref}
          style={[
            frameClassStyle,
            openStyle,
            // The custom-bg brightness filter has no RN equivalent; paint directly.
            customBackgroundColor !== undefined && !isDisabled
              ? { backgroundColor: customBackgroundColor, borderColor: customBackgroundColor }
              : undefined,
            animatedStyle,
            style,
          ]}
          testID={testID}
          {...{ className: frameClassName }}
        >
          {children}
        </AnimatedPressable>
      </ButtonFrameContextProvider>
    )
  },
)
