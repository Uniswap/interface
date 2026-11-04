/**
 * ButtonCompat's WEB dimension-class emission, split out of `./dimensions`
 * purely for the oxlint `max-lines` cap (the same pressure that put the
 * padding-side family, INFRA-3810, over the line there) — the same reason
 * `./native-dimensions` exists beside it. Everything here is web-only class
 * composition; the type surface and the cross-leg pick/split helpers stay in
 * `./dimensions`.
 */
import type * as React from 'react'
import { cn } from '../cn'
import { composeCompatEmission, mergeCompatStyle, type CompatEmission } from '../compat/compose'
import type { MediaPropKey } from '../compat/props'
import {
  ALIGN_SELF_CLASS,
  arbitrary,
  colorClasses,
  enumClass,
  JUSTIFY_CLASS,
  radiusClass,
  sizeValue,
  spacePx,
  type CommonStyleClassOptions,
} from '../compat/style-classes'
import { flexDisplayClass } from '../flex-compat/flex-style-classes'
import {
  buttonCompatMediaPropNames,
  type ButtonCompatDimensionLaneProps,
  type ButtonCompatDimensionProps,
  hasButtonCompatDimensions,
  type ButtonCompatPlatformWebStyleProps,
} from './dimensions'
import { buttonCompatVisualClasses } from './visual-props'

const DIMENSION_UTILITIES = [
  ['w', 'width'],
  ['h', 'height'],
  ['min-w', 'minWidth'],
  ['min-h', 'minHeight'],
  ['max-w', 'maxWidth'],
  ['max-h', 'maxHeight'],
] as const

// Resolution rule: rows are `[shorthand, longhand]` (the shorthand is also
// the utility class prefix), longhand emitted BEFORE shorthand — both compile
// to the same utility and the merge keeps the later class, so the shorthand
// wins when both are set, the shared compat spacing resolution
// (`../compat/style-classes` SPACING_UTILITIES, `../compat/native-style`
// applySpacing). Fixed, unlike legacy's JSX-prop-order resolution: a call site
// relying on `padding` beating a later `p` needs a hand check at conversion
// (the INFRA-3151 defect class).
//
// Ordering: `m`/`p` sit before their own axis/side rows so a later side class
// never loses the shorthand to tailwind-merge's conflict groups; the compiled
// CSS orders m < mx/my < sides (same for p), the legacy shorthand expansion's
// result on both platforms.
const MARGIN_SPELLINGS = [
  ['m', 'margin'],
  ['mx', 'marginHorizontal'],
  ['my', 'marginVertical'],
  ['mt', 'marginTop'],
  ['mb', 'marginBottom'],
  ['ml', 'marginLeft'],
  ['mr', 'marginRight'],
] as const

// Padding-side family (INFRA-3810), same [shorthand, longhand] shape and `p`-first ordering as MARGIN_SPELLINGS.
const PADDING_SPELLINGS = [
  ['p', 'padding'],
  ['px', 'paddingHorizontal'],
  ['py', 'paddingVertical'],
  ['pt', 'paddingTop'],
  ['pb', 'paddingBottom'],
  ['pl', 'paddingLeft'],
  ['pr', 'paddingRight'],
] as const

const SPACING_SPELLINGS = [...MARGIN_SPELLINGS, ...PADDING_SPELLINGS] as const

/**
 * The dimension classes, via the shared compat resolvers. Raw composition:
 * token px values land in the generated compat safelists
 * (`cross(SIZE_PREFIXES, spacePx)` in `../compat/closed-set.ts`, both the web
 * and native artifacts), so this is what the NATIVE frame emits for uniwind;
 * the WEB leg renders through
 * `buttonCompatWebDimensionLane` below so an out-of-set value (e.g.
 * `minHeight={37}`) can never ship a class Tailwind never generated.
 */
export function buttonCompatDimensionClasses(
  props: ButtonCompatPlatformWebStyleProps,
  options: CommonStyleClassOptions = {},
): string[] {
  const cls: string[] = []
  for (const [utility, prop] of DIMENSION_UTILITIES) {
    const value = props[prop]
    if (value !== undefined) {
      cls.push(`${utility}-[${arbitrary(sizeValue(value))}]`)
    }
  }
  if (props.justifyContent !== undefined) {
    cls.push(enumClass({ map: JUSTIFY_CLASS, value: props.justifyContent, cssProp: 'justify-content' }))
  }
  if (props.alignSelf !== undefined) {
    cls.push(enumClass({ map: ALIGN_SELF_CLASS, value: props.alignSelf, cssProp: 'align-self' }))
  }
  if (props.borderRadius !== undefined) {
    cls.push(radiusClass(props.borderRadius))
  }
  // opacity / flexShrink / shadowColor / shadowOpacity / shadowRadius /
  // position / top / alignItems (INFRA-3709/3750/3754): own file, ./visual-props.
  // Emitted BEFORE the flex block below so a numeric `flex`'s plain `shrink`
  // still wins a contested `shrink-[n]` in the class merge.
  cls.push(...buttonCompatVisualClasses(props, options))
  // The shared colour lane: 1-2 classes per prop (themed tokens carry a `dark:` sibling).
  if (props.backgroundColor !== undefined) {
    cls.push(...colorClasses('bg', props.backgroundColor).filter((colorCls) => typeof colorCls === 'string'))
  }
  if (props.borderColor !== undefined) {
    cls.push(...colorClasses('border', props.borderColor).filter((colorCls) => typeof colorCls === 'string'))
  }
  if (props.display !== undefined) {
    cls.push(flexDisplayClass(props.display))
  }
  if (props.textDecoration !== undefined) {
    // The `$platform-web` pool's one extra key (see ButtonCompatPlatformWebStyleProps):
    // the long-tail arbitrary property, matching the shared compiler's spelling —
    // the enumerated singles are in the closed set, the rest ride the var twin.
    cls.push(`[text-decoration:${arbitrary(props.textDecoration)}]`)
  }
  if (props.gap !== undefined && props.gap !== null) {
    cls.push(`gap-[${spacePx(props.gap)}]`)
  }
  for (const [shorthand, longhand] of SPACING_SPELLINGS) {
    for (const key of [longhand, shorthand] as const) {
      const value = props[key]
      // `null` is a legal SpaceValue (INFRA-3821) meaning "not set", same as `undefined`.
      if (value !== undefined && value !== null) {
        cls.push(`${shorthand}-[${spacePx(value)}]`)
      }
    }
  }
  if (props.flexBasis !== undefined) {
    cls.push(`basis-[${arbitrary(sizeValue(props.flexBasis))}]`)
  }
  if (props.flex !== undefined) {
    // Numeric `flex` → `grow-[n] shrink`, mirroring the shared flexbox lane
    // (`../compat/style-classes` flexboxStyleClasses): Tamagui web keeps
    // flex-basis auto for a numeric flex, so this emits the grow/shrink
    // longhands and never a `basis`, leaving any `flexBasis` uncontested.
    cls.push(`grow-[${props.flex}]`, 'shrink')
  }
  return cls
}

/**
 * The WEB rendering path for the dimension slice: the deterministic-emission
 * contract (INFRA-3217, the `touchableAreaCompatEmission` shape). In-set
 * classes (every token px value plus the enumerated specials) come back
 * verbatim; values outside the closed set ride the safelisted
 * var-indirection twins (`min-h-⟦var(--c-min-h)⟧` — ⟦⟧ for [] because oxide
 * extracts candidate-shaped literals from comments, and this file is in
 * apps/mobile's `@source` scan, so the plainly-spelled class would compile
 * into the NATIVE stylesheet and trip the INFRA-3265 twin-reader gates; the
 * `emitted-classes.ts` encoding) with the value on an inline `--c*` custom
 * property, so nothing renders unstyled.
 */
export function buttonCompatDimensionEmission(props: ButtonCompatDimensionLaneProps): CompatEmission {
  // S is the $platform-web slice (the dimension surface + textDecoration): the
  // engine compiles every pool — base, media, and the top-level $platform-web
  // (applied unconditionally, the web-only-component doctrine) — through the
  // same styleClasses compiler, so the widest pool's slice is the generic.
  return composeCompatEmission<ButtonCompatPlatformWebStyleProps>({
    props,
    baseClasses: '',
    styleClasses: buttonCompatDimensionClasses,
  })
}

type LanePoolKey = Exclude<keyof ButtonCompatDimensionLaneProps, keyof ButtonCompatDimensionProps | MediaPropKey>

/**
 * The lane's pool keys beyond the base slice and the media pools — the skip gate iterates these rather
 * than hand-listing pools parallel to `composeCompatEmission`'s walk. Two-way type-pinned like
 * `DIMENSION_PROP_KEYS`: a missing pool fails `satisfies`, a stale key fails excess-property checking.
 */
const LANE_POOL_KEYS = Object.keys({
  '$platform-web': true,
  backgroundColor: true,
} satisfies Record<LanePoolKey, true>) as readonly LanePoolKey[]

/**
 * The web leg's whole dimension lane in one call, so the component body adds
 * zero branch points (it sits at the oxlint `complexity` cap): merge the
 * emission's classes ahead of the caller's `className` (so an explicit caller
 * class still wins) and its inline custom properties under the caller's
 * `style`. With no dimension set, both pass through untouched — the rendered
 * output stays byte-identical to the pre-INFRA-3283 pin.
 */
export function buttonCompatWebDimensionLane({
  className,
  style,
  ...dimensions
}: ButtonCompatDimensionLaneProps & {
  className?: string
  style?: React.CSSProperties
}): { className: string | undefined; style: React.CSSProperties | undefined } {
  if (
    !hasButtonCompatDimensions(dimensions) &&
    buttonCompatMediaPropNames(dimensions).length === 0 &&
    LANE_POOL_KEYS.every((key) => dimensions[key] === undefined)
  ) {
    return { className, style }
  }
  const emission = buttonCompatDimensionEmission(dimensions)
  return {
    className: cn(emission.className, className),
    style: mergeCompatStyle(emission.style, style),
  }
}
