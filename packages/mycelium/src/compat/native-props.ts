/**
 * The non-style forwarding surface of the compat platform legs on React Native
 * (INFRA-3229) — the native twin of `compat/dom.tsx`'s `domProps`.
 *
 * `domProps` is entirely web: it maps `accessibilityRole` through the
 * react-native-web ARIA table, turns `onPress`/`onLongPress` into one `onClick`,
 * and forwards anchor/pointer/touch DOM attributes. Natively almost all of that
 * inverts: the whole `accessibility*` block and every `aria-*` prop except
 * `aria-labelledby` are REAL React Native props, so the legs forward them
 * verbatim — a genuine upgrade over the web leg, which had to drop most of them.
 *
 * Like `TouchableAreaCompat.native.tsx`, this is a curated ALLOW-LIST, never a
 * `{...props}` spread: DOM-only props (`tag`, `href`, `target`, `rel`,
 * `download`, `htmlFor`, `title`, `tabIndex`, `dangerouslySetInnerHTML`) are
 * dropped by omission so they can never reach a native host.
 *
 * The behavioral press props (`onPress`/`onPressIn`/`onPressOut`/`onLongPress`)
 * forward separately through `nativePressProps` below (INFRA-3536): they need
 * the web leg's disabled/attach gating, which this unconditional copy loop
 * cannot express.
 */
import type { GestureResponderEvent } from 'react-native'
import { GESTURE_RESPONDER_PROP_KEYS } from './gesture-responder-props'
import type {
  CompatAriaProps,
  CompatBehavioralProps,
  CompatEventProps,
  CompatInertProps,
  CompatLegacyA11yProps,
} from './props'

/** Real RN props on View/Text since 0.71 (`aria-labelledby` is DOM-only and deliberately absent). */
const ARIA_PROP_KEYS = [
  'aria-busy',
  'aria-checked',
  'aria-disabled',
  'aria-expanded',
  'aria-hidden',
  'aria-label',
  'aria-live',
  'aria-modal',
  'aria-selected',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'aria-valuetext',
] as const

/**
 * The deprecated RN accessibility block. The web leg documents these as
 * "no web effect in Tamagui either"; natively every one is live.
 */
const A11Y_PROP_KEYS = [
  'accessible',
  'accessibilityActions',
  'accessibilityElementsHidden',
  'accessibilityHint',
  'accessibilityIgnoresInvertColors',
  'accessibilityLabel',
  'accessibilityLanguage',
  'accessibilityLiveRegion',
  'accessibilityRole',
  'accessibilityValue',
  'accessibilityViewIsModal',
  'importantForAccessibility',
  'onAccessibilityAction',
  'onAccessibilityEscape',
  'onAccessibilityTap',
  'onMagicTap',
] as const

/**
 * `CompatInertProps`' native half — inert on web precisely because these are RN
 * rendering hints. The Tamagui runtime knobs (`untilMeasured`,
 * `disableOptimization`, `disableClassName`, `debug`, `componentName`,
 * `passThrough`) and the deprecated child-spacing trio (`space`,
 * `spaceDirection`, `separator`) stay accepted-and-ignored, exactly as on web.
 */
const NATIVE_HINT_PROP_KEYS = [
  'collapsable',
  'collapsableChildren',
  'needsOffscreenAlphaCompositing',
  'removeClippedSubviews',
  'renderToHardwareTextureAndroid',
  'shouldRasterizeIOS',
  'isTVSelectable',
  'hasTVPreferredFocus',
  'tvParallaxProperties',
  'tvParallaxShiftDistanceX',
  'tvParallaxShiftDistanceY',
  'tvParallaxTiltAngle',
  'tvParallaxMagnification',
  'hitSlop',
] as const

// `GESTURE_RESPONDER_PROP_KEYS` (imported above): real on native, inert on
// web (`compat/props.ts` CompatInertProps doc). Spread BEFORE
// `useNativePressResponder`'s own wiring on every layout leg's host
// (`FlexCompat.native.tsx`), so a live press prop's internal responder wins
// on the handful of keys it also sets; the rest ride through untouched.

type NativeForwardableProps = CompatAriaProps & CompatLegacyA11yProps & CompatInertProps & CompatBehavioralProps

/**
 * Build the native host's non-style props. `disabled` has no RN `View`
 * counterpart, so it becomes `accessibilityState.disabled` (the
 * `TouchableAreaCompat.native.tsx` precedent) merged over any explicit
 * `accessibilityState` — the `aria-disabled:`-scoped classes the compiler emits
 * for `disabledStyle` do NOT resolve natively, which is a pinned gap.
 */
export function nativeCompatProps(props: NativeForwardableProps): Record<string, unknown> {
  const source = props as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of [
    ...ARIA_PROP_KEYS,
    ...A11Y_PROP_KEYS,
    ...NATIVE_HINT_PROP_KEYS,
    ...GESTURE_RESPONDER_PROP_KEYS,
  ] as readonly string[]) {
    if (source[key] !== undefined) {
      out[key] = source[key]
    }
  }
  if (props.nativeID !== undefined) {
    out['nativeID'] = props.nativeID
  }
  if (props.role !== undefined) {
    out['role'] = props.role
  }
  if (props.testID !== undefined) {
    out['testID'] = props.testID
  }
  const disabled = props.disabled === true
  if (props.accessibilityState !== undefined || disabled) {
    out['accessibilityState'] = disabled ? { ...props.accessibilityState, disabled: true } : props.accessibilityState
  }
  if (disabled) {
    out['aria-disabled'] = true
  }
  return out
}

/**
 * The behavioral press family (`CompatBehavioralProps`' interaction slice that
 * legacy Tamagui dispatches natively). Exported so the leg suites enumerate the
 * family from the module that owns it instead of hand-typing the four strings.
 */
export const PRESS_HANDLER_KEYS = ['onPress', 'onPressIn', 'onPressOut', 'onLongPress'] as const

export type NativePressHandler = (event: GestureResponderEvent) => void

export type NativePressProps = { [K in (typeof PRESS_HANDLER_KEYS)[number]]?: NativePressHandler }

export type PressForwardableProps = Pick<CompatEventProps, (typeof PRESS_HANDLER_KEYS)[number]> &
  Pick<CompatBehavioralProps, 'disabled'>

/**
 * The press handlers a native leg dispatches (INFRA-3536) — forwarded to RN
 * `Text`'s built-in pressability, or driven through the layout legs' responder
 * wiring (`useNativePressResponder`, native-pressability.ts). Web-parity
 * gating:
 *
 * - `disabled` detaches the whole surface, exactly like the web leg's
 *   composed interaction wiring (`compat/dom.tsx`);
 * - per-handler truthiness like Tamagui's `attachPress` — a runtime
 *   `onPress={null}` must not attach.
 *
 * The shared prop contract types the handlers with DOM events; natively they
 * receive gesture-responder events (the `TouchableAreaCompat.native.tsx` cast
 * precedent). One deliberate divergence from the web leg stays: web has no
 * long-press timing (its click fires onPress + onLongPress together), while
 * natively RN's real pressability times `onLongPress` — legacy Tamagui native
 * behaves the same way, so call sites keep their per-platform semantics.
 */
export function nativePressProps(props: PressForwardableProps): NativePressProps {
  if (props.disabled === true) {
    return {}
  }
  const out: NativePressProps = {}
  for (const key of PRESS_HANDLER_KEYS) {
    const handler = props[key]
    if (handler) {
      // CAUTION: the shared contract types these with DOM events, but native
      // delivers GestureResponderEvent — a shared handler that touches
      // DOM-only members (event.preventDefault(), event.clientX, …) breaks on
      // device. Typed per-platform handlers (or a lint pointer) are a
      // suggested follow-up on INFRA-3536.
      out[key] = handler as unknown as NativePressHandler
    }
  }
  return out
}

/**
 * Whether `nativePressProps` attached anything — the layout legs' live-tap-target
 * signal. It gates whether `useNativePressResponder` (native-pressability.ts)
 * attaches its responder wiring, never the host TYPE — that stays a plain
 * View unconditionally so re-renders never remount — and never any a11y prop
 * (legacy Tamagui parity; see the wiring module's header).
 */
export function hasNativePressProps(pressProps: NativePressProps): boolean {
  return PRESS_HANDLER_KEYS.some((key) => pressProps[key] !== undefined)
}

/** Stable no-op so `nativeTextPressProps`' responder forcing never churns RN Text's memoized pressability config. */
const NOOP_PRESS: NativePressHandler = () => undefined

/**
 * `nativePressProps` for the Text leg. RN `Text` installs its press responder
 * only for `onPress`/`onLongPress` (Text.js `isPressable`) — `onPressIn`/
 * `onPressOut` ride along but never force it, so a pressIn/pressOut-only call
 * site would silently never fire. Legacy Tamagui's attachPress gate includes
 * the pair (and the layout legs' responder wiring dispatches it), so a no-op
 * `onPress` forces the responder on. Deliberately NOT further gated: the
 * forced responder claims touches on the Text ahead of ancestor tap targets,
 * exactly as legacy Tamagui's attachPress pressability did for a
 * pressIn/pressOut-only Text — parity, not an accident.
 */
export function nativeTextPressProps(props: PressForwardableProps): NativePressProps {
  const out = nativePressProps(props)
  if ((out.onPressIn || out.onPressOut) && !out.onPress && !out.onLongPress) {
    out.onPress = NOOP_PRESS
  }
  return out
}
