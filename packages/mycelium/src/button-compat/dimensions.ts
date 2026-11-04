/**
 * ButtonCompat's dimension/layout slice: `minWidth` / `minHeight` /
 * `maxWidth` / `maxHeight` (INFRA-3283), plus `width` / `height` /
 * `justifyContent` (INFRA-3478), plus `gap` / `p` / `padding` (INFRA-3472),
 * plus `flex` / `flexBasis` (INFRA-3603), plus the margin family (INFRA-3661),
 * plus `borderRadius` / `alignSelf` and the top-level `$platform-web` pool
 * (INFRA-3541), plus `borderColor` and `display` — the style props the legacy
 * Tamagui Button accepts like any styled component. `DialogButtons.tsx` keys every Dialog's action row on
 * `minHeight="$spacing36"`; `PositionsHeader.tsx` keys its stacked create
 * button on `width="100%"` / `height="$spacing36"` /
 * `justifyContent="flex-start"`; `InfoRowActionButton.tsx` keys its text-only
 * action on `gap="$spacing6"` / `p={0}`; `DappRequestContent.tsx` keys its
 * footer buttons on `flexBasis={1}` and `QueuedOrderModal` on
 * `{ flex: 1, flexBasis: 1 }`; `ConfirmLimitOrderModal/Error.tsx` needs
 * `mt="$spacing8"` on its retry button (worked around with a wrapper Flex in
 * PR #40010 until this lane existed);
 * `TopVerifiedAuctionsDiscoverySection.tsx` keys its see-all link CTA on
 * `borderRadius="$roundedFull"` / `alignSelf="flex-start"` /
 * `$platform-web={{ textDecoration: 'none' }}` on top of the INFRA-3478 link
 * form. The visual/positioning widening (opacity, flexShrink, the shadow
 * trio, position/top, alignItems) lives in the sibling `./visual-props`.
 *
 * Lives beside `./compile` rather than in it purely for the oxlint
 * `max-lines` cap (the same reason `compile.ts` itself exists). Everything
 * here is pure and platform-neutral; the native leg's RN-style lane stays in
 * `ButtonCompat.native.tsx` (it needs `../compat/native-style`, which the web
 * bundle has no reason to carry).
 *
 * Values follow the shared compat `SizeValue` contract (`sizeValue()`, the
 * INFRA-3232 resolution pattern): numbers are px, `$space` tokens resolve off
 * `SPACE_TOKEN_PX` to their exact value — an unknown token THROWS, never
 * emits raw, never lands on a near neighbour — and other strings pass
 * through (`'100%'`, `'auto'`, `'max-content'`).
 */
import { MEDIA_VARIANT } from '../compat/media'
import type {
  ColorValue,
  CompatMediaProps,
  DisplayValue,
  MediaPropKey,
  RadiusValue,
  SizeValue,
  SpaceValue,
} from '../compat/props'
import type { AlignSelf, JustifyContent } from '../flex-compat/props'
import type { ButtonCompatVisualProps } from './visual-props'

/**
 * A type alias, not an interface, on purpose: the emission engine's
 * `CompatProps<S>` carries the `$group-*` index signatures, and only object
 * literal types get TypeScript's implicit index signature.
 */
export type ButtonCompatDimensionProps = ButtonCompatVisualProps & {
  width?: SizeValue
  height?: SizeValue
  minWidth?: SizeValue
  minHeight?: SizeValue
  maxWidth?: SizeValue
  maxHeight?: SizeValue
  /**
   * Main-axis alignment of the icon/label row (INFRA-3478). An enum lane, not
   * a `SizeValue` one: values in `JUSTIFY_CLASS` compile to the shared
   * `justify-*` utilities (all in the closed set), anything else falls back to
   * the arbitrary-property twin like the other compat components.
   */
  justifyContent?: JustifyContent
  /**
   * Icon/label row gap (INFRA-3472, legacy `gap="$spacing6"`). A `SpaceValue`
   * lane on the shared `spacePx` contract (`$space` token → exact px, unknown
   * token → throw), overriding the size variant's own `gap-*` in the merge.
   */
  gap?: SpaceValue
  /** Padding shorthand (INFRA-3472, legacy `p={0}`): same value contract as gap, overriding the size variant's `p-*`/`px-*`/`py-*` */
  p?: SpaceValue
  /** Longhand spelling of `p`; when a call site sets both, `p` wins (see the SPACING_SPELLINGS note) */
  padding?: SpaceValue
  /** Padding-axis/side family (INFRA-3810): same `SpaceValue` contract and both-leg wired status as `p`; a side beats an axis beats `p` (`SPACING_SPELLINGS` below) */
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
   * Margin family (INFRA-3661, legacy `mt="$spacing8"` — the
   * `ConfirmLimitOrderModal/Error.tsx` retry button, wrapper-Flex-worked-around
   * in PR #40010). Same `SpaceValue` lane as `p` (`$space` token → exact px,
   * unknown token → throw, `auto`/`%` pass through); the frame styles no
   * margin at rest, so nothing is contested. A side utility beats an axis one
   * beats `m` in the compiled CSS (Tailwind orders m < mx/my < sides), the
   * same resolution the legacy shorthand expansion gives on both platforms.
   */
  m?: SpaceValue
  /** Horizontal-axis margin (left + right) */
  mx?: SpaceValue
  /** Vertical-axis margin (top + bottom) */
  my?: SpaceValue
  /** Margin top */
  mt?: SpaceValue
  /** Margin bottom */
  mb?: SpaceValue
  /** Margin left */
  ml?: SpaceValue
  /** Margin right */
  mr?: SpaceValue
  /** Longhand spelling of `m`; when a call site sets both spellings, the shorthand wins (see the SPACING_SPELLINGS note) */
  margin?: SpaceValue
  /** Longhand spelling of `mx`, same fixed shorthand-wins resolution */
  marginHorizontal?: SpaceValue
  /** Longhand spelling of `my` */
  marginVertical?: SpaceValue
  /** Longhand spelling of `mt` */
  marginTop?: SpaceValue
  /** Longhand spelling of `mb` */
  marginBottom?: SpaceValue
  /** Longhand spelling of `ml` */
  marginLeft?: SpaceValue
  /** Longhand spelling of `mr` */
  marginRight?: SpaceValue
  /**
   * Flex grow factor (INFRA-3603, legacy `flex={1}`). Compiles to `grow-[n]
   * shrink` — the longhand pair Tamagui web emits for a numeric `flex`, which
   * keeps `flex-basis: auto` rather than the CSS `flex` shorthand's `0%`, so a
   * sibling `flexBasis` is uncontested (never a same-property conflict).
   */
  flex?: number
  /**
   * Flex basis (INFRA-3603, legacy `flexBasis={1}`). Same `SizeValue` lane as
   * `width` (`$space` token → exact px, unknown → throw, other strings pass
   * through); a call-site value overrides the `fill` frame default's `basis-0`.
   */
  flexBasis?: SizeValue
  /**
   * Border radius (INFRA-3541, legacy `borderRadius="$roundedFull"` — the
   * Auctions discovery see-all CTA). The shared `radiusClass` contract:
   * `$rounded*` token / number → exact px off `RADIUS_TOKEN_PX` (unknown token
   * THROWS, never emits raw), CSS pass-through strings verbatim. Overrides the
   * size variant's own `rounded-*` in the merge.
   */
  borderRadius?: RadiusValue
  /**
   * Cross-axis self-alignment (INFRA-3541, legacy `alignSelf="flex-start"`).
   * An enum lane like `justifyContent`: values in `ALIGN_SELF_CLASS` compile
   * to the shared `self-*` utilities (all in the closed set), anything else
   * falls back to the arbitrary-property twin. Overrides the `fill` frame
   * default's `self-stretch`.
   */
  alignSelf?: AlignSelf
  /**
   * Border color, through the shared compat colour lane (`colorClasses`):
   * semantic `$` tokens compile to the `border-*` utilities (an unknown token
   * THROWS, never emits raw; themed pairs emit their `dark:` sibling), and
   * non-token CSS values (`'unset'`) ride the colour-form arbitrary value.
   * Beats the variant cell's own border colour, and an explicit value beats
   * the internal custom-`backgroundColor` border on both legs.
   */
  borderColor?: ColorValue
  /**
   * CSS `display`, the enum lane every other compat primitive already carries:
   * values in the shared `DISPLAY_CLASS` map compile to the curated utilities
   * (`none` → `hidden`), `inherit` falls back to the arbitrary-property twin.
   * The driving shape is breakpoint-hiding through the media pools
   * (`$md={{ display: 'none' }}`).
   */
  display?: DisplayValue
}

/**
 * The style slice the top-level `$platform-web` pool admits (INFRA-3541): the
 * dimension surface plus the web-only `textDecoration` long-tail single the
 * pool exists for — the legacy link-form call sites pass
 * `$platform-web={{ textDecoration: 'none' }}` because `textDecoration` is
 * CSS-only (RN spells it `textDecorationLine`), so it can never sit at the
 * Button's top level. ButtonCompat's legs are platform-resolved, so the web
 * leg applies the pool unconditionally (the `CompatPlatformProps` doctrine)
 * and the native leg ignores it entirely — exactly what legacy Tamagui does
 * on device, so the drop is parity, not a loss, and deliberately not in the
 * native dev-warn ledger.
 */
export type ButtonCompatPlatformWebStyleProps = ButtonCompatDimensionProps & {
  /** CSS `text-decoration` shorthand: the enumerated singles (`none`/`underline`/`line-through`) are in the closed set; anything else rides the safelisted var-indirection twin. */
  textDecoration?: string
  /**
   * The THEME-TOKEN half of `backgroundColor`, same `colorClasses` contract as `borderColor`. The web
   * leg splits the top-level prop on `getMaybeHexOrRgbColor`, so only its token half lands here; a
   * hex inside the `$platform-web` pool stays a plain background, which is also what legacy does
   * (the custom lane is a top-level-prop behaviour). WEB-ONLY, hence not in
   * `ButtonCompatDimensionProps`: the native leg handles the top-level prop itself (hex/rgb via
   * `style`, tokens via the frame's state classes).
   */
  backgroundColor?: ColorValue
}

/** The ONE declaration that a leg accepts the top-level `$platform-web` pool: both legs' public `ButtonCompatProps` extend it (web applies it unconditionally; native leaves it inert — rationale above). */
export type ButtonCompatPlatformWebProps = {
  '$platform-web'?: ButtonCompatPlatformWebStyleProps
}

/**
 * The responsive media pools (INFRA-3240): the shared `$sm`/`$md`/… keys every
 * compat component admits (`CompatMediaProps`, variants byte-identical to
 * Tamagui's media queries — see `../compat/media.ts`), scoped to the style
 * surface ButtonCompat already accepts. Typed off `ButtonCompatDimensionProps`
 * on purpose, so the media surface grows in lockstep as the base surface does.
 */
export type ButtonCompatMediaProps = CompatMediaProps<ButtonCompatDimensionProps>

/** The web dimension lane's full input: the base slice plus every extra pool it compiles (media + `$platform-web`); the skip gate's pool checks derive from it via `LANE_POOL_KEYS`. */
export type ButtonCompatDimensionLaneProps = ButtonCompatDimensionProps &
  ButtonCompatMediaProps &
  ButtonCompatPlatformWebProps &
  Pick<ButtonCompatPlatformWebStyleProps, 'backgroundColor'>

const MEDIA_PROP_KEYS = Object.keys(MEDIA_VARIANT) as MediaPropKey[]

/**
 * The lane's full key set, pinned two-way against the type: the `satisfies`
 * bound fails compilation when a prop is added to `ButtonCompatDimensionProps`
 * but not listed here (missing key), and excess-property checking fails a key
 * the type no longer carries — so the has-check below can never silently skip
 * a new prop.
 */
export const DIMENSION_PROP_KEYS = Object.keys({
  width: true,
  height: true,
  minWidth: true,
  minHeight: true,
  maxWidth: true,
  maxHeight: true,
  justifyContent: true,
  gap: true,
  p: true,
  padding: true,
  px: true,
  py: true,
  pt: true,
  pb: true,
  pl: true,
  pr: true,
  paddingHorizontal: true,
  paddingVertical: true,
  paddingTop: true,
  paddingBottom: true,
  paddingLeft: true,
  paddingRight: true,
  m: true,
  mx: true,
  my: true,
  mt: true,
  mb: true,
  ml: true,
  mr: true,
  margin: true,
  marginHorizontal: true,
  marginVertical: true,
  marginTop: true,
  marginBottom: true,
  marginLeft: true,
  marginRight: true,
  flex: true,
  flexBasis: true,
  borderRadius: true,
  alignSelf: true,
  borderColor: true,
  display: true,
  // The `./visual-props` slice, intersected into the type above.
  opacity: true,
  flexShrink: true,
  flexGrow: true,
  overflow: true,
  shadowColor: true,
  shadowOpacity: true,
  shadowRadius: true,
  position: true,
  top: true,
  alignItems: true,
} satisfies Record<keyof ButtonCompatDimensionProps, true>) as readonly (keyof ButtonCompatDimensionProps)[]

/** Any dimension/layout/spacing prop set? Lets the legs skip the lane entirely at rest. */
export function hasButtonCompatDimensions(props: ButtonCompatDimensionProps): boolean {
  return DIMENSION_PROP_KEYS.some((key) => props[key] !== undefined)
}

/**
 * The media prop names actually SET, in `MEDIA_VARIANT` order — the web lane's
 * skip gate and the native leg's dev-warn ledger input share it.
 */
export function buttonCompatMediaPropNames(props: ButtonCompatMediaProps): MediaPropKey[] {
  return MEDIA_PROP_KEYS.filter((key) => props[key] !== undefined)
}

/**
 * Partition a rest-prop object into the media pools and everything else. The
 * key list derives from `MEDIA_VARIANT` — never hand-listed — so a pool added
 * there is extracted here automatically and can never ride a `...rest` spread
 * onto the DOM (INFRA-3240 review). The web leg is the consumer: it hands
 * `media` to the dimension lane and spreads only `rest` onto the element.
 */
export function splitButtonCompatMediaProps<T extends ButtonCompatMediaProps>(
  props: T,
): { media: ButtonCompatMediaProps; rest: Omit<T, MediaPropKey> } {
  const media: ButtonCompatMediaProps = {}
  const rest = { ...props }
  for (const key of MEDIA_PROP_KEYS) {
    const value = rest[key]
    if (value !== undefined) {
      media[key] = value
    }
    delete rest[key]
  }
  return { media, rest }
}

/**
 * Partition a rest-prop object into the dimension slice and everything else —
 * the `splitButtonCompatMediaProps` doctrine applied to this lane. The key
 * list derives from `DIMENSION_PROP_KEYS` (type-pinned two-way above), never
 * a hand list, so a prop added to `ButtonCompatDimensionProps` is extracted
 * here automatically and can never ride a `...rest` spread onto the DOM. The
 * web leg is the consumer: it hands `dimensions` to the dimension lane and
 * spreads only `rest` onto the element.
 */
export function splitButtonCompatDimensionProps<T extends ButtonCompatDimensionProps>(
  props: T,
): { dimensions: ButtonCompatDimensionProps; rest: Omit<T, keyof ButtonCompatDimensionProps> } {
  const dimensions: ButtonCompatDimensionProps = {}
  const rest = { ...props }
  for (const key of DIMENSION_PROP_KEYS) {
    setDimensionProp({ target: dimensions, key, value: props[key] })
    delete rest[key]
  }
  return { dimensions, rest }
}

/** Generic single-key write, so the mixed-value-type key union assigns without a cast (shared with `./native-dimensions`). */
export function setDimensionProp<K extends keyof ButtonCompatDimensionProps>({
  target,
  key,
  value,
}: {
  target: ButtonCompatDimensionProps
  key: K
  value: ButtonCompatDimensionProps[K]
}): void {
  if (value !== undefined) {
    target[key] = value
  }
}

// WEB class-emission (buttonCompatDimensionClasses/Emission, buttonCompatWebDimensionLane) lives in
// ./web-dimensions, split out purely for the oxlint max-lines cap. Not re-exported here: web-dimensions.ts
// imports the types/helpers above, so a re-export back would make the two files an import cycle
// (oxlint no-cycle). Callers of the web-only functions import from ./web-dimensions directly.
