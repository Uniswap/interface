/**
 * The component-agnostic half of the Tamagui→Tailwind compat prop contract.
 *
 * A component's full prop type is `CompatProps<S>`, where `S` is that
 * component's own curated style-prop surface (e.g. `FlexCompatStyleProps`).
 * The generic surfaces here — pseudo states, responsive media, platform/theme
 * overrides, group states, animation presets, and the non-style pass-through
 * (aria, legacy a11y, events, inert native knobs, behavioral) — are shared by
 * every migrated component, so a new component only has to define `S`.
 */
import type * as React from 'react'
import type { AnimateEnterExitPreset, AnimateEnterPreset, AnimateExitPreset } from './animations'
import type { LongTailStyleProp } from './style-props'
import type { SporeColorToken, SporeRadiusToken, SporeSpaceToken } from './tokens'

/** Spore space token, raw pixel number, percentage, or `auto`. */
export type SpaceValue = SporeSpaceToken | number | `${number}%` | 'auto'
/** Spore color token or any raw CSS color (`#131313`, `rgba(0,0,0,0.5)`, …). */
export type ColorValue = SporeColorToken | (string & {})
/** Numbers are pixels; strings pass through (`'100%'`, `'auto'`, `'max-content'`). */
export type SizeValue = number | string

export type PositionValue = 'absolute' | 'relative' | 'static' | 'fixed' | 'sticky' | 'unset'
export type OverflowValue = 'visible' | 'hidden' | 'scroll' | 'auto' | 'unset'
export type DisplayValue = 'inherit' | 'none' | 'inline' | 'block' | 'contents' | 'flex' | 'inline-flex' | 'unset'

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
  borderWidth?: number
  borderTopWidth?: number
  borderBottomWidth?: number
  borderLeftWidth?: number
  borderRightWidth?: number
  borderRadius?: SporeRadiusToken | number
  opacity?: number
  overflow?: OverflowValue

  // positioning
  position?: PositionValue
  top?: SpaceValue
  right?: SpaceValue
  bottom?: SpaceValue
  left?: SpaceValue
  zIndex?: number

  // transforms (merged into one `transform` declaration, Tamagui ordering)
  x?: number
  y?: number
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
  shadowOffset?: { width: number; height: number }
  shadowOpacity?: number
  shadowRadius?: number
  boxShadow?: string
}

/** Generic long-tail props — compiled to arbitrary-property utilities. */
export type LongTailStyleProps = {
  [K in LongTailStyleProp]?: string | number
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
 * Responsive media props. The generated variants (`media-sm:` …) emit media
 * queries byte-identical to Tamagui's (`ui/src/theme/media.ts` — max-width /
 * max-height, inclusive bounds).
 */
export type CompatMediaProps<S> = {
  [K in MediaPropKey]?: S & CompatPseudoProps<S>
}

export interface CompatPlatformProps<S> {
  /** Applied on web builds (these components are web-only, so: always applied). */
  '$platform-web'?: S & CompatPseudoProps<S>
  /** Native-only overrides — ignored on web, exactly like Tamagui does. */
  '$platform-native'?: Record<string, unknown>
  '$platform-ios'?: Record<string, unknown>
  '$platform-android'?: Record<string, unknown>
}

export interface CompatThemeProps<S> {
  /** Applied when a `.dark` ancestor is present (the web dark-theme marker). */
  '$theme-dark'?: S
  /** Applied when no `.dark` ancestor is present. */
  '$theme-light'?: S
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

export interface CompatAnimationProps {
  /**
   * Accepted for compatibility; timing configs are driver concerns Tamagui
   * resolves at runtime (including the per-property object form). The CSS
   * presets below carry fixed timings instead.
   */
  animation?: string | readonly unknown[] | Readonly<Record<string, unknown>> | null
  animateOnly?: string[]
  animatePresence?: boolean
  animateEnter?: AnimateEnterPreset
  animateExit?: AnimateExitPreset
  animateEnterExit?: AnimateEnterExitPreset
}

/** RN aria-* passthrough surface (forwarded verbatim to the DOM element). */
export interface CompatAriaProps {
  'aria-busy'?: boolean
  'aria-checked'?: boolean | 'mixed'
  'aria-disabled'?: boolean
  'aria-expanded'?: boolean
  'aria-hidden'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-live'?: 'polite' | 'assertive' | 'off'
  'aria-modal'?: boolean
  'aria-selected'?: boolean
  'aria-valuemax'?: number
  'aria-valuemin'?: number
  'aria-valuenow'?: number
  'aria-valuetext'?: string
}

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

/**
 * Interaction handlers. Method syntax keeps parameter typing bivariant so
 * handlers written against Tamagui's RN-flavored event types remain
 * assignable; at runtime they receive the corresponding DOM events
 * (onPress → click, onPressIn/Out → pointerdown/up, onHoverIn/Out →
 * mouseenter/leave), which is what Tamagui dispatches on web too.
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
  onPress?(this: void, event: React.MouseEvent<HTMLElement>): void
  onPressIn?(this: void, event: React.PointerEvent<HTMLElement>): void
  onPressOut?(this: void, event: React.PointerEvent<HTMLElement>): void
  /**
   * Tamagui web has no long-press timing: its click handler invokes
   * onLongPress together with onPress. Compat components dispatch identically.
   */
  onLongPress?(this: void, event: React.MouseEvent<HTMLElement>): void
  onHoverIn?(this: void, event: React.MouseEvent<HTMLElement>): void
  onHoverOut?(this: void, event: React.MouseEvent<HTMLElement>): void
  onMouseEnter?(this: void, event: React.MouseEvent<HTMLElement>): void
  onMouseLeave?(this: void, event: React.MouseEvent<HTMLElement>): void
  onMouseDown?(this: void, event: React.MouseEvent<HTMLElement>): void
  onMouseUp?(this: void, event: React.MouseEvent<HTMLElement>): void
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
}

/**
 * Native-only rendering hints and Tamagui runtime knobs: accepted so call
 * sites keep compiling, inert on web — which matches Tamagui's own web
 * behavior for every prop in this block except the deprecated child-spacing
 * trio at the end (see its docs and the parity exclusions ledger).
 */
export interface CompatInertProps {
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

export interface CompatBehavioralProps {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  id?: string
  testID?: string
  /** HTML title attribute (hover tooltip), forwarded to the DOM element. */
  title?: string
  /** Rendered element tag, `div` by default (Tamagui `tag`). */
  tag?: keyof React.JSX.IntrinsicElements | (string & {})
  role?: React.AriaRole
  tabIndex?: string | number
  /** Forwarded to the DOM element (with `tag="a"` this is the anchor href). */
  href?: string
  target?: string
  htmlFor?: string
  rel?: string
  download?: boolean | string
  dangerouslySetInnerHTML?: { __html: string }
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
  theme?: string | null
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
  CompatAnimationProps &
  CompatAriaProps &
  CompatLegacyA11yProps &
  CompatEventProps &
  CompatInertProps &
  CompatBehavioralProps
