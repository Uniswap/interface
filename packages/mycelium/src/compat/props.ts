import type { SporeAnimationCurveName } from '@universe/tailwind/animations'
/**
 * The component-agnostic half of the Tamagui→Tailwind compat prop contract.
 * A component's full prop type is `CompatProps<S>`, where `S` is that
 * component's own curated style-prop surface (e.g. `FlexCompatStyleProps`).
 * The generic surfaces here — pseudo states, responsive media, platform/theme
 * overrides, group states, animation presets, and the non-style pass-through
 * (aria, legacy a11y, events, inert native knobs, behavioral) — are shared by
 * every migrated component, so a new component only has to define `S`.
 */
import type * as React from 'react'
// Type-only — react-native runtime imports are banned outside .native legs.
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'
import type { AnimateEnterExitPreset, AnimateEnterPreset, AnimateExitPreset } from './animations'
import type { CompatAriaProps } from './aria-props'
// Value legs (Spore tokens + the non-token legacy family) live beside their runtime resolvers in css-values.ts.
import type { BorderWidthValue, ColorValue, RadiusValue, SizeValue, SpaceValue, ZIndexValue } from './css-values'
import type { CompatGestureResponderProps } from './gesture-responder-props'
import type { InheritedTextStyleProps } from './inherited-text-props'
import type { SafeCompatTag } from './safe-tags'
import type { LongTailStyleProp } from './style-props'
import type { TamaguiVariable } from './tokens'

export type {
  BorderWidthValue,
  ColorValue,
  CssLengthValue,
  CssPassthroughValue,
  CssUniversalValue,
  RadiusValue,
  SizeValue,
  SpaceValue,
  ZIndexValue,
} from './css-values'
export type { TamaguiVariable }

export type PositionValue = 'absolute' | 'relative' | 'static' | 'fixed' | 'sticky' | 'unset'
export type OverflowValue = 'visible' | 'hidden' | 'clip' | 'scroll' | 'auto' | 'unset'
export type DisplayValue =
  | 'inherit'
  | 'none'
  | 'inline'
  | 'block'
  | 'contents'
  | 'flex'
  | 'inline-flex'
  | 'grid'
  | 'inline-grid'
  | 'unset'

export interface InsetShorthand {
  top?: SpaceValue
  right?: SpaceValue
  bottom?: SpaceValue
  left?: SpaceValue
}

/** One entry of an RN-style transform array (`[{ translateX: 10 }, …]`). */
export type TransformEntry = Readonly<Record<string, string | number | readonly number[]>>

/**
 * The universal style-prop surface every migrated component shares: margin /
 * padding, sizing, visuals, positioning, transforms, shadows. A component
 * intersects this with its own layout props (e.g. flexbox) to form its `S`.
 */
export interface CompatStyleProps {
  // margin / padding (Tamagui shorthands + RN longhands)
  m?: SpaceValue
  mx?: SpaceValue
  my?: SpaceValue
  mt?: SpaceValue
  mb?: SpaceValue
  ml?: SpaceValue
  mr?: SpaceValue
  p?: SpaceValue
  px?: SpaceValue
  py?: SpaceValue
  pt?: SpaceValue
  pb?: SpaceValue
  pl?: SpaceValue
  pr?: SpaceValue
  margin?: SpaceValue
  marginHorizontal?: SpaceValue
  marginVertical?: SpaceValue
  marginTop?: SpaceValue
  marginBottom?: SpaceValue
  marginLeft?: SpaceValue
  marginRight?: SpaceValue
  padding?: SpaceValue
  paddingHorizontal?: SpaceValue
  paddingVertical?: SpaceValue
  paddingTop?: SpaceValue
  paddingBottom?: SpaceValue
  paddingLeft?: SpaceValue
  paddingRight?: SpaceValue

  // sizing
  width?: SizeValue
  height?: SizeValue
  minWidth?: SizeValue
  minHeight?: SizeValue
  maxWidth?: SizeValue
  maxHeight?: SizeValue

  // visuals
  backgroundColor?: ColorValue
  borderColor?: ColorValue
  borderWidth?: BorderWidthValue
  borderTopWidth?: BorderWidthValue
  borderBottomWidth?: BorderWidthValue
  borderLeftWidth?: BorderWidthValue
  borderRightWidth?: BorderWidthValue
  borderRadius?: RadiusValue
  opacity?: number
  overflow?: OverflowValue

  // positioning
  position?: PositionValue
  top?: SpaceValue
  right?: SpaceValue
  bottom?: SpaceValue
  left?: SpaceValue
  zIndex?: ZIndexValue

  // transforms (merged into one `transform` declaration, Tamagui ordering)
  x?: BorderWidthValue
  y?: BorderWidthValue
  scale?: number
  scaleX?: number
  scaleY?: number
  rotate?: string
  rotateX?: string
  rotateY?: string
  rotateZ?: string
  skewX?: string
  skewY?: string
  perspective?: number
  matrix?: readonly number[]
  transform?: string | readonly TransformEntry[]
  transformOrigin?: string

  // shadows (composed into one `box-shadow` declaration, Tamagui format)
  shadowColor?: ColorValue
  shadowOffset?: { width: BorderWidthValue; height: BorderWidthValue }
  shadowOpacity?: number
  shadowRadius?: BorderWidthValue
  boxShadow?: string
}

/** Generic long-tail props — compiled to arbitrary-property utilities. Variables unwrap like every other lane. */
export type LongTailStyleProps = {
  [K in LongTailStyleProp]?: string | number | TamaguiVariable
}

/**
 * Pseudo-state style objects. Web semantics match Tamagui's: hoverStyle is
 * hover-media-guarded `:hover`, pressStyle applies on pointer-down
 * (`:active`), focusStyle/focusVisibleStyle/focusWithinStyle map to their CSS
 * pseudo-classes, and disabledStyle is `[aria-disabled]`-gated CSS — the
 * `disabled` prop sets the attribute, exactly as Tamagui web renders it.
 */
export interface CompatPseudoProps<S> {
  hoverStyle?: S
  pressStyle?: S
  focusStyle?: S
  focusVisibleStyle?: S
  focusWithinStyle?: S
  disabledStyle?: S
}

export type MediaPropKey =
  | '$xxs'
  | '$xs'
  | '$sm'
  | '$md'
  | '$lg'
  | '$xl'
  | '$xxl'
  | '$xxxl'
  | '$short'
  | '$midHeight'
  | '$lgHeight'

/**
 * Responsive media props. Generated variants (`media-sm:` …) emit media
 * queries byte-identical to Tamagui's (`ui/src/theme/media.ts`). Platform
 * pools nest inside media values just like Tamagui (`$md={{ '$platform-web':
 * {…} }}`); native pools are accepted-but-ignored since these components are
 * web-only.
 */
export type CompatMediaProps<S> = {
  [K in MediaPropKey]?: S & CompatPseudoProps<S> & CompatPlatformProps<S>
}

export interface CompatPlatformProps<S> {
  /** Applied on web builds (these components are web-only, so: always applied). */
  '$platform-web'?: S & CompatPseudoProps<S> & InheritedTextStyleProps
  /** Native-only overrides — ignored on web, exactly like Tamagui does. */
  '$platform-native'?: Record<string, unknown>
  '$platform-ios'?: Record<string, unknown>
  '$platform-android'?: Record<string, unknown>
}

export interface CompatThemeProps<S> {
  /** Applied when a `.dark` ancestor is present (the web dark-theme marker). */
  '$theme-dark'?: S & CompatPseudoProps<S>
  /** Applied when no `.dark` ancestor is present. */
  '$theme-light'?: S & CompatPseudoProps<S>
}

export type GroupState = 'hover' | 'press' | 'focus' | 'focusVisible' | 'focusWithin'
export type GroupStatePropKey = `$group-${GroupState}` | `$group-${string}-${GroupState}`

/**
 * Group-state style props: `$group-hover` targets any ancestor `group`,
 * `$group-item-hover` targets the ancestor `group="item"`. Compiled to
 * Tailwind `group-*` variants; the ancestor gets its marker class from the
 * `group` prop.
 */
export type CompatGroupProps<S> = {
  [K in GroupStatePropKey]?: S
}

export interface CompatAnimationProps<S> {
  /**
   * Accepted for compatibility; timing configs are driver concerns Tamagui
   * resolves at runtime (including the per-property object form). The CSS
   * presets below carry fixed timings instead. Names are the Spore curve
   * vocabulary (`@universe/tailwind/animations`), the number-exact port of
   * the legacy driver presets. Its Reanimated leg (`…/animations/reanimated`)
   * is what HAND-ROLLED native conversions call directly, not a driver this
   * prop's VALUE feeds: see the `animation-prop` native ruling in
   * `.claude/skills/tamagui-conversion/references/manual-lane.md`. Name leg
   * is a closed union (SporeAnimationCurveName), not `string`, so
   * arbitrary/dynamic names don't typecheck.
   */
  animation?: SporeAnimationCurveName | readonly unknown[] | Readonly<Record<string, unknown>> | null
  animateOnly?: string[]
  /** Never styling (compose ignores it); read by `Presence` (src/presence) on a direct child — `false` opts out of the exit hold, unmounting immediately. */
  animatePresence?: boolean
  animateEnter?: AnimateEnterPreset
  animateExit?: AnimateExitPreset
  animateEnterExit?: AnimateEnterExitPreset
  /**
   * First-paint-only style values, merged then released a tick later
   * (`createCompatComponent`, `./dom`) — a mount-flip, not a keyframe; needs an explicit `transition` (`animation` above is accepted-and-inert here).
   * Composes in the base pool, so a same-property override from a higher-precedence pool (`$platform-web`/`$theme-*`/media/`forceStyle`) still wins over it, and collides with `animateEnter`/`animateExit`/`animateEnterExit` on the same property (`checkAnimationPresetCollision`) — treat the two as mutually exclusive per property.
   * `exitStyle` is deferred (needs Presence's AnimatePresence lifecycle, INFRA-3289).
   */
  enterStyle?: S
}

export type { CompatAriaProps }

/**
 * Deprecated RN accessibility props. `accessibilityLabel`/`accessibilityRole`
 * map onto their ARIA equivalents; the rest are accepted for compatibility
 * (they have no web effect in Tamagui either — its web output relies on the
 * aria-* props above).
 */
export interface CompatLegacyA11yProps {
  accessible?: boolean
  accessibilityActions?: ReadonlyArray<{ name: string; label?: string }>
  accessibilityElementsHidden?: boolean
  accessibilityHint?: string
  accessibilityIgnoresInvertColors?: boolean
  accessibilityLabel?: string
  accessibilityLabelledBy?: string | string[]
  accessibilityLanguage?: string
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
  accessibilityRole?: string
  accessibilityState?: {
    disabled?: boolean
    selected?: boolean
    checked?: boolean | 'mixed'
    busy?: boolean
    expanded?: boolean
  }
  accessibilityValue?: { min?: number; max?: number; now?: number; text?: string }
  accessibilityViewIsModal?: boolean
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants'
  onAccessibilityAction?(this: void, event: unknown): void
  onAccessibilityEscape?(this: void): void
  onAccessibilityTap?(this: void): void
  onMagicTap?(this: void): void
}

/** Legacy typed press events as the RN `GestureResponderEvent` while dispatching DOM events, so both are
 *  assignable. Narrowing to `GestureResponderEvent` alone measured WORSE on every project. */
type CompatPressEvent = React.MouseEvent<HTMLElement> | GestureResponderEvent
type CompatPressInOutEvent = CompatPressEvent | React.TouchEvent<HTMLElement>

/**
 * Interaction handlers. Method syntax keeps parameter typing bivariant so
 * handlers written against Tamagui's RN-flavored event types remain
 * assignable; at runtime they receive the corresponding DOM events
 * (onPress → click, onPressIn/Out → mousedown/up + touchstart/end — exactly
 * what Tamagui dispatches on web (`getWebEvents` in @tamagui/web) — and
 * onHoverIn/Out → pointerenter/leave, the platform's one hover seam, a
 * deliberate divergence from Tamagui's mouseenter/leave; see compat/dom.tsx).
 */
export interface CompatEventProps {
  /**
   * Layout notifications via ResizeObserver (react-native-web semantics:
   * fires after mount and on size changes, with the border-box rect).
   */
  onLayout?(
    this: void,
    event: { nativeEvent: { layout: { x: number; y: number; width: number; height: number } } },
  ): void
  onPress?(this: void, event: CompatPressEvent): void
  onPressIn?(this: void, event: CompatPressInOutEvent): void
  onPressOut?(this: void, event: CompatPressInOutEvent): void
  /**
   * Tamagui web has no long-press timing: its click handler invokes
   * onLongPress together with onPress. Compat components dispatch identically.
   */
  onLongPress?(this: void, event: CompatPressEvent): void
  /**
   * Raw click handler, accepted like Tamagui web (createComponent destructures
   * `onClick` for next/link compat) and merged into the composed click handler
   * AHEAD of onPress/onLongPress — Tamagui's compose order. Like every
   * press-family prop it trips the truthiness-based press attach gate.
   */
  onClick?(this: void, event: React.MouseEvent<HTMLElement>): void
  /**
   * Rides onPointerEnter with the touch anti-flicker filter — the platform's
   * ONE hover seam (the same seam the styled() factory binds), a deliberate
   * documented divergence from Tamagui web's composed mouseenter (#37920; see
   * compat/dom.tsx). Attaches whenever present (compat has no hover attach
   * gate); a raw onPointerEnter chains after it.
   */
  onHoverIn?(this: void, event: React.PointerEvent<HTMLElement>): void
  /**
   * Rides onPointerLeave, unfiltered — leave always resets so a touch-filtered
   * enter can never strand stale hover state.
   */
  onHoverOut?(this: void, event: React.PointerEvent<HTMLElement>): void
  onMouseEnter?(this: void, event: React.MouseEvent<HTMLElement>): void
  onMouseLeave?(this: void, event: React.MouseEvent<HTMLElement>): void
  /**
   * Tamagui web merges raw onMouseDown/onMouseUp into its composed
   * pressIn/pressOut handlers, which are wired to the touch events too — so
   * these can receive touch events, exactly like under Tamagui.
   */
  onMouseDown?(this: void, event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>): void
  onMouseUp?(this: void, event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>): void
  onMouseMove?(this: void, event: React.MouseEvent<HTMLElement>): void
  onFocus?(this: void, event: React.FocusEvent<HTMLElement>): void
  onBlur?(this: void, event: React.FocusEvent<HTMLElement>): void
  onPointerEnter?(this: void, event: React.PointerEvent<HTMLElement>): void
  onPointerLeave?(this: void, event: React.PointerEvent<HTMLElement>): void
  onPointerDown?(this: void, event: React.PointerEvent<HTMLElement>): void
  onPointerUp?(this: void, event: React.PointerEvent<HTMLElement>): void
  onPointerMove?(this: void, event: React.PointerEvent<HTMLElement>): void
  onPointerCancel?(this: void, event: React.PointerEvent<HTMLElement>): void
  onPointerEnterCapture?(this: void, event: React.PointerEvent<HTMLElement>): void
  onPointerLeaveCapture?(this: void, event: React.PointerEvent<HTMLElement>): void
  onPointerDownCapture?(this: void, event: React.PointerEvent<HTMLElement>): void
  onPointerUpCapture?(this: void, event: React.PointerEvent<HTMLElement>): void
  onPointerMoveCapture?(this: void, event: React.PointerEvent<HTMLElement>): void
  onPointerCancelCapture?(this: void, event: React.PointerEvent<HTMLElement>): void
  onTouchStart?(this: void, event: React.TouchEvent<HTMLElement>): void
  onTouchMove?(this: void, event: React.TouchEvent<HTMLElement>): void
  onTouchEnd?(this: void, event: React.TouchEvent<HTMLElement>): void
  onTouchCancel?(this: void, event: React.TouchEvent<HTMLElement>): void
  onTouchEndCapture?(this: void, event: React.TouchEvent<HTMLElement>): void
  onPointerOut?(this: void, event: React.PointerEvent<HTMLElement>): void
  // Raw DOM handlers with no Tamagui composed equivalent, forwarded verbatim.
  // `onScroll` lives on `FlexCompatOwnEventProps` instead, since ScrollViewCompat
  // already owns a differently-shaped `onScroll` on this shared surface.
  onKeyDown?(this: void, event: React.KeyboardEvent<HTMLElement>): void
  onAnimationEnd?(this: void, event: React.AnimationEvent<HTMLElement>): void
  onTransitionEnd?(this: void, event: React.TransitionEvent<HTMLElement>): void
}

/**
 * Native-only rendering hints and Tamagui runtime knobs: accepted so call
 * sites keep compiling, inert on web (except the deprecated child-spacing
 * trio at the end). Extends the gesture-responder family (own file, `max-lines` split).
 */
export interface CompatInertProps extends CompatGestureResponderProps {
  collapsable?: boolean
  collapsableChildren?: boolean
  needsOffscreenAlphaCompositing?: boolean
  removeClippedSubviews?: boolean
  renderToHardwareTextureAndroid?: boolean
  shouldRasterizeIOS?: boolean
  isTVSelectable?: boolean
  hasTVPreferredFocus?: boolean
  tvParallaxProperties?: Record<string, unknown>
  tvParallaxShiftDistanceX?: number
  tvParallaxShiftDistanceY?: number
  tvParallaxTiltAngle?: number
  tvParallaxMagnification?: number
  nativeID?: string
  hitSlop?: number | InsetShorthand | null
  untilMeasured?: 'hide' | 'show'
  disableOptimization?: boolean
  disableClassName?: boolean
  debug?: boolean | 'break' | 'verbose' | 'profile'
  componentName?: string
  passThrough?: boolean
  /**
   * @deprecated Tamagui: use `gap`. Unlike the props above, Tamagui web does
   * still honor the deprecated child-spacing trio (it injects Spacer /
   * separator elements between children); compat components deliberately
   * accept-and-ignore them so call sites keep compiling — spacing must be
   * expressed via `gap`. See the parity exclusions ledger.
   */
  space?: SpaceValue | boolean
  /** @deprecated Tamagui: use `gap`. Accepted-and-ignored — see `space`. */
  spaceDirection?: 'horizontal' | 'vertical' | 'both'
  /** @deprecated Tamagui: can implement your own hook or component. Accepted-and-ignored — see `space`. */
  separator?: React.ReactNode
}

/**
 * The compat `style` prop: web `CSSProperties` or an RN `StyleProp<ViewStyle>`,
 * so consumer APIs typed `StyleProp<ViewStyle | ...>` forward into it without
 * casts (same union as `CheckboxCompatStyleProp`). Native legs hand it to the
 * RN style array verbatim; web legs flatten it with `flattenCompatStyle`.
 * Caveats on web: `RegisteredStyle` ids cannot be resolved there and are
 * dropped, and RN-only style keys (`marginHorizontal`, transform arrays, …)
 * are NOT converted to CSS — web-rendered call sites must pass CSS-compatible
 * declarations, as before; development builds warn once per such key
 * (`mergeCompatStyle`).
 */
export type CompatStyleProp = StyleProp<ViewStyle | React.CSSProperties>

export interface CompatBehavioralProps {
  className?: string
  style?: CompatStyleProp
  children?: React.ReactNode
  id?: string
  testID?: string
  /**
   * Arbitrary `data-*` attributes, forwarded to the DOM on web (`domProps`),
   * dropped by the native allow-list — mirrors Tamagui web's viewProps
   * routing (e.g. Progress's `data-state`/`data-value`/`data-max`). Lives here
   * so it widens EVERY primitive's surface, not just Progress; a typo'd
   * `data-stat` still type-checks (`unknown`-valued).
   */
  [dataAttr: `data-${string}`]: unknown
  /** HTML title attribute (hover tooltip), forwarded to the DOM element. */
  title?: string
  /** Rendered element tag, `div` by default (Tamagui `tag`). Limited to SAFE_COMPAT_TAGS. */
  tag?: SafeCompatTag
  role?: React.AriaRole
  tabIndex?: string | number
  /** Forwarded to the DOM element (with `tag="a"` this is the anchor href). */
  href?: string
  target?: string
  htmlFor?: string
  rel?: string
  download?: boolean | string
  /** Raw HTML `inert` attribute (drops focus/interaction/find-in-page while `true`), forwarded verbatim. */
  inert?: boolean
  /** Matches React's own `DOMAttributes['dangerouslySetInnerHTML']` (`TrustedHTML` included); forwarded verbatim, no coercion. */
  dangerouslySetInnerHTML?: { __html: string | TrustedHTML }
  /**
   * Mirrors Tamagui web: sets `aria-disabled` (which gates `disabledStyle`'s
   * `[aria-disabled]`-scoped CSS) and detaches the composed interaction
   * surface (onPress family, hover/press/focus handlers).
   */
  disabled?: boolean
  /** Forces a pseudo style state on (merges that style into the base). */
  forceStyle?: 'hover' | 'press' | 'focus' | 'focusVisible' | 'focusWithin'
  /**
   * Group marker: `true` renders the `group` class, a name renders
   * `group/<name>` — the anchors for `$group-*` props on descendants.
   */
  group?: string | boolean
  /**
   * Theme subtree props are accepted but inert: themes are driven by the
   * `.dark` ancestor class on web, not per-subtree providers. `$theme-dark` /
   * `$theme-light` cover conditional styling per theme.
   */
  theme?: string | null | TamaguiVariable
  themeInverse?: boolean
  themeShallow?: boolean
  asChild?: boolean | 'except-style' | 'except-style-web' | 'web'
}

/**
 * A migrated component's full prop contract: its own style-prop surface `S`
 * plus every shared compat surface. `FlexCompatProps = CompatProps<FlexCompatStyleProps>`.
 */
export type CompatProps<S> = S &
  CompatPseudoProps<S> &
  CompatMediaProps<S> &
  CompatPlatformProps<S> &
  CompatThemeProps<S> &
  CompatGroupProps<S> &
  CompatAnimationProps<S> &
  CompatAriaProps &
  CompatLegacyA11yProps &
  CompatEventProps &
  CompatInertProps &
  CompatBehavioralProps
