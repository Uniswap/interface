/**
 * The NATIVE leg's public prop surface, extracted from
 * `ButtonCompat.native.tsx` purely for the oxlint `max-lines` cap (the same
 * pressure that extracted `./compile`). Types only — RN / RNGH imports are
 * type-only, so this file is safe for any graph to resolve (the
 * `../compat/native-style` precedent).
 *
 * The shape deliberately mirrors the web leg's `ButtonCompatProps` minus the
 * DOM inheritance; `export-type-parity.test.ts` pins the shared prop set and
 * per-prop type identity across the legs, with the `style` divergence pinned
 * by reason (the press handlers are shared via `./press-handler`, INFRA-3261).
 */
import type { JSX, ReactNode } from 'react'
import type { Insets, StyleProp, TextStyle, ViewStyle } from 'react-native'
import type {
  BorderWidthValue,
  ColorValue,
  DisplayValue,
  OverflowValue,
  PositionValue,
  RadiusValue,
  SizeValue,
  SpaceValue,
} from '../compat/props'
import type { AlignItems, AlignSelf, JustifyContent } from '../flex-compat/props'
import type { ButtonEmphasis, ButtonFocusScaling, ButtonIconPosition, ButtonSize, ButtonVariant } from './compile'
import type { ButtonCompatMediaProps, ButtonCompatPlatformWebProps } from './dimensions'
import type { ButtonPressHandler } from './press-handler'
import type { ButtonTextStyleSurface } from './text-props'

// The press-handler typing is shared with the web leg (INFRA-3261) so the two
// legs' `onPress`/`onDisabledPress` cannot drift; see ./press-handler.
export type { ButtonPressHandler } from './press-handler'

/**
 * The responsive media pools (`$sm`/`$md`/…, INFRA-3240) are accepted for
 * call-site parity with the web leg; NO native handling — the leg dev-warns
 * each set pool as dropped (`warnUnsupportedNativeProps`) rather than dropping
 * it in silence. Wiring them is a deliberate non-goal until a native call site
 * needs it (the INFRA-3283 dimension precedent).
 *
 * The top-level `$platform-web` pool composes in via
 * `ButtonCompatPlatformWebProps` — inert on this leg with NO dev-warning,
 * unlike the dropped props: legacy parity, not a loss (the full rationale
 * lives on `ButtonCompatPlatformWebStyleProps` in ./dimensions).
 */
export interface ButtonCompatProps extends ButtonCompatMediaProps, ButtonCompatPlatformWebProps {
  size?: ButtonSize
  variant?: ButtonVariant
  emphasis?: ButtonEmphasis
  /** Stretch to fill the parent (legacy default: true) */
  fill?: boolean
  /** Accepted for API parity; emits nothing on native (no focus ring) */
  focusScaling?: ButtonFocusScaling
  /** Auto-themed + auto-sized from the button's variant/emphasis/size */
  icon?: JSX.Element
  iconPosition?: ButtonIconPosition
  /** Spinner in the button text color; button becomes non-interactive */
  loading?: boolean
  /** Runs a LayoutAnimation when `loading` flips (legacy useLayoutAnimationOnChange) */
  shouldAnimateBetweenLoadingStates?: boolean
  /** Disabled UI; blocks interaction unless onDisabledPress is provided */
  disabled?: boolean
  /** Keeps the button interactive while showing the disabled styling */
  onDisabledPress?: ButtonPressHandler
  onPress?: ButtonPressHandler
  /** Drop the text line-height (languages with special characters) */
  lineHeightDisabled?: boolean
  /** Custom background; text/icon auto-contrast */
  backgroundColor?: string
  /** WIRED on this leg like gap: rides the min/max dimension lane. */
  width?: SizeValue
  /**
   * Accepted for call-site parity with the web leg; NO native handling: the
   * leg dev-warns it as dropped (`warnUnsupportedNativeProps`) rather than
   * dropping it in silence. Wiring it is a deliberate non-goal until a native
   * call site needs it.
   */
  height?: SizeValue
  /** Min width: number (px), `$space` token (resolved, unknown → throw), or CSS length string */
  minWidth?: SizeValue
  /** Min height (legacy `minHeight="$spacing36"`, the DialogButtons action row) */
  minHeight?: SizeValue
  /** Max width: same value contract as minWidth */
  maxWidth?: SizeValue
  /** Max height: same value contract as minWidth */
  maxHeight?: SizeValue
  /** Same accepted-but-dropped status as height (an enum lane on the web leg) */
  justifyContent?: JustifyContent
  /** Same accepted-but-dropped status as justifyContent (INFRA-3754, an enum lane on the web leg) */
  alignItems?: AlignItems
  /**
   * Icon/label row gap (INFRA-3472). WIRED on this leg, unlike height: the
   * driving call sites are native-reachable (`packages/uniswap`), so the leg
   * rides the min/max dimension lane — token classes plus the resolved value
   * through `style` (`compat/native-style.ts`).
   */
  gap?: SpaceValue
  /** Padding shorthand (legacy `p={0}`): same wired-on-native status as gap */
  p?: SpaceValue
  /** Longhand spelling of `p`; `p` wins when both are set (the shared compat spacing resolution, fixed — not legacy's JSX prop order) */
  padding?: SpaceValue
  /**
   * Padding-axis/side family (legacy `py="$spacing12"` / `px="$spacing8"`).
   * Same wired-on-native status as `p`/gap: token classes ride the frame
   * className and the resolved values ride the style lane
   * (`compat/native-style.ts` applySpacing).
   */
  px?: SpaceValue
  py?: SpaceValue
  pt?: SpaceValue
  pb?: SpaceValue
  pl?: SpaceValue
  pr?: SpaceValue
  /** Longhand spellings of the padding-side props above; the shorthand wins when both spellings of one prop are set (the p/padding rule) */
  paddingHorizontal?: SpaceValue
  paddingVertical?: SpaceValue
  paddingTop?: SpaceValue
  paddingBottom?: SpaceValue
  paddingLeft?: SpaceValue
  paddingRight?: SpaceValue
  /**
   * Margin family (INFRA-3661, legacy `mt="$spacing8"`). WIRED on this leg
   * like gap/p: token classes ride the frame className and the resolved
   * values ride the style lane (`compat/native-style.ts` applySpacing, where
   * the side key beats the axis key beats `margin` — RN's own edge
   * precedence, matching the web utilities' m < mx/my < sides order).
   */
  m?: SpaceValue
  mx?: SpaceValue
  my?: SpaceValue
  mt?: SpaceValue
  mb?: SpaceValue
  ml?: SpaceValue
  mr?: SpaceValue
  /** Longhand spellings of the margins above; the shorthand wins when both spellings of one prop are set (the p/padding rule) */
  margin?: SpaceValue
  marginHorizontal?: SpaceValue
  marginVertical?: SpaceValue
  marginTop?: SpaceValue
  marginBottom?: SpaceValue
  marginLeft?: SpaceValue
  marginRight?: SpaceValue
  /**
   * Flex grow factor (INFRA-3603, WIRED since INFRA-3750 — the earn
   * withdraw/deposit actions and the NetworkCostEditor cancel/save row are
   * native-reachable, so the leg rides the min/max dimension lane like `gap`).
   */
  flex?: number
  /** Flex basis (INFRA-3603, legacy `flexBasis={1}`): same accepted-but-dropped status as height (the driving call sites — DappRequestContent, QueuedOrderModal's `isWebPlatform` guard — stay web-only) */
  flexBasis?: SizeValue
  /** Border radius (INFRA-3541, legacy `borderRadius="$roundedFull"`): same accepted-but-dropped status as height (the driving call site is the web-only link form) */
  borderRadius?: RadiusValue
  /** Cross-axis self-alignment (INFRA-3541, an enum lane on the web leg): same accepted-but-dropped status as height */
  alignSelf?: AlignSelf
  /**
   * Opacity (INFRA-3709, legacy `opacity={isViewOnlyWallet ? 0.4 : undefined}`
   * — the mobile SendFormButton.tsx view-only dimming). WIRED: plain 0-1
   * number, no token resolution, rides the min/max dimension lane like `gap`.
   */
  opacity?: number
  /** Flex shrink factor (INFRA-3750, legacy `flexShrink={1}` — the mobile LandingScreen.tsx create-account CTA). WIRED, independent of `flex`. */
  flexShrink?: number
  /** Flex grow factor alone. WIRED through the shared layout style lane; a numeric `flex` set alongside wins. */
  flexGrow?: number
  /** WIRED through the shared layout style lane, which drops (and dev-warns) the web-only `auto`/`clip`/`unset` values. */
  overflow?: OverflowValue
  /** Shadow color (INFRA-3750, legacy `shadowColor="$accent1"`). WIRED: resolves through the shared shadow-color map, dropping (not throwing) an unmapped token — see `nativeShadowColorExpression` in `./ButtonCompat.native`. */
  shadowColor?: ColorValue
  /** Shadow opacity (INFRA-3750). WIRED: folds into the composed shadow via the shared style lane. */
  shadowOpacity?: number
  /** Shadow blur radius (INFRA-3750). WIRED: same `BorderWidthValue` contract as the shared shadow surface. */
  shadowRadius?: BorderWidthValue
  /** Same accepted-but-dropped status as height: RN does support `position`, but this prop's only call sites are web, so the leg dev-warns rather than wiring it. */
  position?: PositionValue
  /** Position offset (INFRA-3754, legacy `top={0}`): same accepted-but-dropped status as `position` */
  top?: SpaceValue
  /**
   * Hit-region padding (INFRA-3750, legacy `hitSlop={16}` — the mobile
   * LandingScreen.tsx create-account CTA). WIRED directly onto the Pressable
   * — unlike the rest of this surface, it compiles to no class on either leg.
   */
  hitSlop?: number | Insets | null
  /**
   * Border color. WIRED on this leg like gap: semantic token classes ride the
   * frame className (they're in the native safelist) and non-token values ride
   * the style lane (`compat/native-style.ts` applyVisuals). An explicit value
   * beats the custom-`backgroundColor` border, matching the web leg.
   */
  borderColor?: ColorValue
  /** Same accepted-but-dropped status as height — the driving call-site shape is web breakpoint-hiding via the media pools */
  display?: DisplayValue
  /**
   * Caller-visible group anchor (INFRA-3550): renders the `group`/`group/<name>`
   * marker on the web leg. NO native handling — uniwind drops `group-*`
   * variants silently, and this leg carries interaction state on
   * `ButtonContext` instead — so the prop is accepted for call-site parity and
   * dev-warned as dropped (`warnUnsupportedNativeProps`).
   */
  group?: string | boolean
  /**
   * The web leg's link form (INFRA-3478): `tag="a"` renders an anchor there.
   * NO native handling — this leg always mounts a Pressable, never an anchor,
   * so the prop is accepted for call-site parity and dev-warned as dropped
   * (`warnUnsupportedNativeProps`): a converted call site keeps compiling but
   * loses its navigation, which must never happen in silence. Drive native
   * navigation from `onPress` instead.
   */
  tag?: 'a' | 'button'
  /** Same accepted-but-dropped status as tag — no anchor exists to receive it */
  href?: string
  /** Same accepted-but-dropped status as tag */
  target?: string
  /** Same accepted-but-dropped status as tag */
  rel?: string
  /** Accepted for parity; inert on native — it only coloured the web focus ring */
  'primary-color'?: string
  'dd-action-name'?: string
  /** First-class RN prop here, not mapped to `data-testid` */
  testID?: string
  className?: string
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

/**
 * The NATIVE `Button.Text` surface: the shared styled contract (INFRA-3550,
 * `./text-props`) over the RN pass-through. Of the styled surface, `variant`
 * is wired (it only re-picks the cell) and `animation` is inert on every leg;
 * the web-rendered rest is accepted for call-site parity and dev-warned as
 * dropped (`buttonTextDroppedStyleNames`).
 */
export interface ButtonTextProps extends ButtonTextStyleSurface {
  lineHeightDisabled?: boolean
  className?: string
  style?: StyleProp<TextStyle>
  children?: ReactNode
}
