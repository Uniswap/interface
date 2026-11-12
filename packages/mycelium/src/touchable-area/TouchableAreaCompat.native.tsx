import * as React from 'react'
import {
  type GestureResponderEvent,
  type Insets,
  type LayoutChangeEvent,
  Platform,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import { useResolveClassNames, useUniwind } from 'uniwind'
import { warnUnsupportedNativeProps } from '../compat/native-diagnostics'
import { useNativeActivateAction, useNativePressResponder } from '../compat/native-pressability'
import { nativeCompatProps } from '../compat/native-props'
import { compatLayoutNativeStyle, type CompatLayoutProps } from '../compat/native-style'
import { markMyceliumPrimitive } from '../compat/primitive-marker'
import { touchableAreaCompatNativeClassName } from './compile'
import type { TouchableAreaCompatProps } from './props'
import { resolveTouchableAreaCompatProps } from './resolve'

/**
 * Native rendering of TouchableAreaCompat: `Pressable` semantics — press
 * dispatch (with the legacy stop-propagation gating), long press, disabled
 * gating, auto hit-slop and minimum touch-target measurement, and the
 * press-state scale/opacity feedback (`scaleTo`/`activeOpacity`).
 *
 * The host is RNGH's `Pressable`, matching the legacy `ui/src` frame
 * (`TouchableAreaFrame.native.tsx`). This is load-bearing, not stylistic: the
 * legacy frame is a native RNGH button, and a plain RN-core `Pressable` nested
 * inside one never receives presses (the native gesture wins before the JS
 * responder system runs), so a converted child touchable inside an unconverted
 * legacy TouchableArea silently goes dead (SWAP-3255).
 *
 * Press DISPATCH, however, rides the RN responder system
 * (`useNativePressResponder`), not the host's own gesture callbacks: an outer
 * RNGH gesture (react-native-sortables' drag, a swipeable row) cancels the
 * button's internal tap — pressIn/pressOut deliver, press never fires — while
 * the responder pipeline still receives release/terminate. Legacy Tamagui
 * dispatches identically (`usePressability` composed onto the RNGH host), so
 * host-for-arbitration + responder-for-dispatch is the legacy-parity pair.
 *
 * Styles: the compiled native className resolves through uniwind's store
 * (`useResolveClassNames`) and paints via `style` — RNGH's Pressable is not a
 * uniwind-wrapped host, so an attached className prop is silently dropped
 * (INFRA-3771; same seam as the button-frame native leg). The native
 * style-parity suite (`packages/tailwind/src/parity/touchable-area/
 * native-parity.test.tsx`) pins the resolution equivalence.
 *
 * INFRA-3507: unlike the web leg (which renders through the emission-based
 * compiler with a guaranteed-in-stylesheet contract), this leg resolves its
 * whole class string through uniwind's on-device store with no inline-style
 * fallback if a class ever misses that lookup — `bg-transparent`, the frame's
 * always-on background reset, included. `backgroundColor` is therefore also
 * forced explicitly from the JS-resolved prop pool whenever the pool doesn't
 * define its own (every variant except `filled`/`floating`/disabled-`raised`),
 * so the frame can never paint an unstyled background regardless of whether
 * the class lookup succeeds. The check is gated on the ACTIVE theme
 * (`useUniwind().theme`): `$theme-dark`/`$theme-light` resolve independently
 * (they compile to `dark:`/`light:`-prefixed classes), so a caller that only
 * paints a background in one theme must still get the transparent fallback in
 * the other. `android_ripple` is pinned to a fully transparent ripple for the
 * same reason: the frame's own press feedback is the JS-driven scale/opacity
 * pool below, not a native ripple, so nothing should rely on RNGH's own
 * ripple-color default.
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

    // Press dispatch rides the RN RESPONDER system, not the RNGH Pressable's
    // internal gestures: an outer RNGH gesture (e.g. react-native-sortables'
    // drag in edit mode) cancels the button's own tap — pressIn/pressOut
    // deliver but press never fires — while the responder pipeline still gets
    // release/terminate. Legacy Tamagui dispatches the same way
    // (usePressability onto the RNGH host), so this is the parity path.
    // `disabled` detaches the whole press family inside the hook (via
    // `nativePressProps`); the `?? undefined`s normalize TouchableArea's
    // legacy `| null` press typing to the plain `T | undefined` it expects.
    // Per-value casts only: the gated wrappers are GestureResponderEvent-shaped
    // while the shared prop contract types handlers with DOM events (the
    // documented cast precedent in compat/native-props.ts); the object shape
    // itself stays checked against the hook's param type.
    const gatedOnPress = gated(onPress ?? undefined)
    const responderProps = useNativePressResponder({
      onPress: gatedOnPress as never,
      onPressIn: gated(onPressIn ?? undefined) as never,
      onPressOut: gated(onPressOut ?? undefined) as never,
      onLongPress: (onLongPress ?? undefined) as never,
      disabled,
    })
    const activateProps = useNativeActivateAction({
      onPress: disabled ? undefined : gatedOnPress,
      accessibilityActions: props.accessibilityActions,
      onAccessibilityAction: props.onAccessibilityAction,
    })

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

    // Resolved once and threaded into `touchableAreaCompatNativeClassName`
    // below to avoid re-deriving the same prop pool a second time per render.
    const resolvedTouchableAreaProps = resolveTouchableAreaCompatProps(props)

    // RNGH's Pressable silently drops className (same seam as the button-frame
    // native leg) — resolve the compiled classes here and paint through style,
    // ordered first so the caller's `style` wins.
    const classStyle = useResolveClassNames(
      touchableAreaCompatNativeClassName(props, resolvedTouchableAreaProps),
    ) as StyleProp<ViewStyle>

    // Belt-and-suspenders for INFRA-3507: the class compiler always emits
    // `bg-transparent` for every variant that doesn't paint its own background
    // (`baseClasses` in `./compile`), but that only reaches the frame if
    // uniwind's on-device class lookup above succeeds — there is no
    // inline-style fallback on this leg the way there is on web. Force the
    // same "no background" outcome directly from the JS-resolved prop pool
    // (base pool AND the ACTIVE theme pool — a caller can still paint a
    // `$theme-dark`/`$theme-light`-only background on an otherwise unstyled
    // variant) so the frame never depends solely on that lookup for its own
    // base state. Gated on the active theme, not "either theme": `$theme-dark`
    // and `$theme-light` compile to independent `dark:`/`light:`-prefixed
    // classes, so a background defined only in the OTHER theme must not
    // suppress this fallback in the theme actually rendering. Applied AFTER
    // `classStyle` below so it wins over whatever that lookup produced when
    // the pool truly defines nothing.
    const { theme } = useUniwind()
    const activeThemeStyle =
      theme === 'dark' ? resolvedTouchableAreaProps['$theme-dark'] : resolvedTouchableAreaProps['$theme-light']
    const definesOwnBackground =
      resolvedTouchableAreaProps.backgroundColor !== undefined || activeThemeStyle?.backgroundColor !== undefined
    const noBackgroundStyle: ViewStyle | undefined = definesOwnBackground
      ? undefined
      : { backgroundColor: 'transparent' }

    // The style lane FlexCompat.native already carries (compatLayoutNativeStyle):
    // uniwind's store resolves only build-time-scanned classes, so a
    // runtime-composed arbitrary value (`width={102}` → `w-[102px]`) is
    // class-lane-invisible on device and must ride the RN style object.
    const { style: layoutStyle, dropped } = compatLayoutNativeStyle(props as CompatLayoutProps)
    warnUnsupportedNativeProps('TouchableAreaCompat', dropped)

    const composedStyle = ({ pressed }: { pressed: boolean }): StyleProp<ViewStyle> => [
      classStyle,
      // Wins over `classStyle` on purpose — see the comment above.
      noBackgroundStyle,
      layoutStyle as StyleProp<ViewStyle>,
      minDimensionStyle,
      pressed && !disabled ? pressedStyle : undefined,
      style as StyleProp<ViewStyle>,
    ]

    // Role precedence is OURS, not RN's: an explicit `accessibilityRole`
    // wins (the forwarded `role` is suppressed — RN core prefers `role`
    // when both reach the host, which would invert the contract), a lone
    // `role` maps through untouched, and the 'button' default applies only
    // when neither is given (so it never rides beside a caller's `role`).
    // Both checks below treat `null` the same as `undefined` (`!= null`,
    // matching the `??` on the first line) — otherwise an explicit
    // `accessibilityRole={null}` would suppress `role` without restoring
    // the 'button' default, silently dropping both.
    const resolvedAccessibilityRole =
      (props.accessibilityRole as React.ComponentProps<typeof Pressable>['accessibilityRole']) ??
      (props.role != null ? undefined : 'button')
    const resolvedRole = (props.accessibilityRole != null ? undefined : props.role) as React.ComponentProps<
      typeof Pressable
    >['role']

    return (
      <Pressable
        ref={ref}
        // The shared native pass-through (compat/native-props.ts): collapsable
        // and the other RN rendering hints, nativeID, aria-*/accessibility*,
        // and the accessibilityState+disabled merge. Without it, props injected
        // by wrappers — e.g. RNGH GestureDetector's collapsable={false} — never
        // reach the Pressable (INFRA-3492). Spread first: the explicit props
        // below (resolved hit-slop, gated handlers, composed style) must win.
        {...nativeCompatProps(props)}
        // INFRA-3507: pin the Android ripple to fully transparent rather than
        // RNGH's own default-color logic — the frame's press feedback is the
        // JS-driven scale/opacity pool above, not a native ripple, so nothing
        // should depend on (or be able to change) RNGH's own default here.
        android_ripple={{ color: 'transparent' }}
        accessibilityRole={resolvedAccessibilityRole}
        role={resolvedRole}
        // `disabled` is deliberately NOT passed to the Pressable: it stays
        // enabled so descendant touchables keep receiving presses (a
        // hard-disabled Pressable + the flattened pointerEvents 'none'
        // swallowed the whole subtree). Accessibility still comes from
        // `nativeCompatProps` (`accessibilityState.disabled`/`aria-disabled`).
        hitSlop={resolvedHitSlop}
        testID={testID}
        onLayout={handleLayout}
        // Responder-system dispatch (see the comment above useNativePressResponder).
        // Deliberately NOT the Pressable's own onPress* gesture props: those get
        // cancelled by outer RNGH gestures; the responder pipeline does not.
        // Test harnesses drive this same pipeline (the shared RNGH Pressable
        // mock synthesizes its click from these responder props).
        {...responderProps}
        // After the pass-through: merges the caller's actions/handler (see useNativeActivateAction).
        {...activateProps}
        style={composedStyle}
      >
        {children}
      </Pressable>
    )
  },
)

// Matches the web leg: opts the wrapper out of the legacy wrappers' color
// injection (compat/primitive-marker.ts).
markMyceliumPrimitive(TouchableAreaCompat)
