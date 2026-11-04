/**
 * The Flex-specific half of the FlexCompat compiler: the variant shorthands
 * (row/centered/fill/…), the display map, and the Flex frame defaults. The
 * universal style translation (margin/padding, sizing, visuals, positioning,
 * transforms, shadows, long tail) and the flexbox surface are the shared
 * `commonStyleClasses`/`flexboxStyleClasses` core.
 */
import { inheritedTextClasses } from '../compat/inherited-text-classes'
import {
  arbitrary,
  type ClassList,
  type CommonStyleClassOptions,
  commonStyleClasses,
  enumClass,
  flexboxStyleClasses,
  insetClasses,
  RESET_CLASSES,
} from '../compat/style-classes'
import {
  COLOR_TOKEN_CLASS,
  colorTokenCssValue,
  lookupToken,
  resolveColorOrWarn,
  THEMED_COLOR_TOKEN_CLASSES,
} from '../compat/tokens'
import type { FlexCompatPlatformWebStyleProps, FlexCompatStyleProps } from './props'

export const DISPLAY_CLASS: Record<string, string> = {
  flex: 'flex',
  none: 'hidden',
  block: 'block',
  inline: 'inline',
  'inline-flex': 'inline-flex',
  grid: 'grid',
  'inline-grid': 'inline-grid',
  contents: 'contents',
  inherit: '[display:inherit]',
}

/**
 * Flex frame defaults reproducing what Tamagui's `View` contributes on web
 * (verified against its injected atomic CSS by the parity suite): the shared
 * compat reset plus Flex's own column layout box.
 */
export const BASE_CLASSES = `flex flex-col items-stretch basis-auto ${RESET_CLASSES} shrink-0`

/** Per-lane knobs for the Flex-specific compiler half. */
export interface FlexStyleClassOptions extends CommonStyleClassOptions {
  /** Native lane: `fill` means RN `flex: 1`, whose implied flex-basis is 0 — not web's basis-auto longhands. */
  fillBasisZero?: boolean
}

/**
 * Variants first — explicit props later override them via tailwind-merge,
 * mirroring Tamagui's styled() precedence (props beat variants).
 */
function variantClasses(
  { row, shrink, grow, fill, centered, maxContent, inset }: FlexCompatStyleProps,
  options: FlexStyleClassOptions,
): ClassList {
  const cls: ClassList = []
  if (row !== undefined) {
    cls.push(row ? 'flex-row' : 'flex-col')
  }
  if (shrink) {
    cls.push('shrink')
  }
  if (grow) {
    cls.push('grow')
  }
  if (fill) {
    // Web: Tamagui emits `flex: 1` as flex-grow:1 + flex-shrink:1 with the base
    // flex-basis:auto untouched. Native: the legacy Flex hands RN `flex: 1`,
    // whose Yoga expansion pins flex-basis to 0 POINTS — basis-auto there lets a
    // `height: '100%'` child feed its own measured size back into a scroll
    // container's content height (unbounded growth in horizontal lists), and a
    // percent basis resolves to auto whenever the owner's main axis is
    // indefinite, so only the point spelling closes the loop unconditionally.
    cls.push('grow', 'shrink')
    if (options.fillBasisZero) {
      cls.push('basis-[0px]')
    }
  }
  if (centered) {
    cls.push('items-center', 'justify-center')
  }
  if (maxContent) {
    cls.push('w-max')
  }
  cls.push(...insetClasses(inset))
  return cls
}

/** Shared with view-compat: the plain View maps display values identically. */
export const flexDisplayClass = (value: string): string => enumClass({ map: DISPLAY_CLASS, value, cssProp: 'display' })

/**
 * Gates `colorTokenCssValue` on the token actually being mapped, so a miss is
 * `undefined` rather than its throw. Delegating keeps that function the single source
 * of the var spelling instead of restating it here.
 */
function mappedColorTokenCssValue(token: string): string | undefined {
  const isMapped =
    lookupToken(COLOR_TOKEN_CLASS, token) !== undefined || lookupToken(THEMED_COLOR_TOKEN_CLASSES, token) !== undefined
  return isMapped ? colorTokenCssValue(token, 'color') : undefined
}

/**
 * Flex's own `color` (INFRA-3809) — the same `$` token-or-raw-CSS resolution as every
 * other color long-tail prop, but always an arbitrary property: a `text-*` utility is
 * ambiguously overloaded with font-size classes, the same reason TextCompat's `color`
 * rides `[color:…]` instead of a semantic class.
 *
 * Unlike those props this lane resolves LENIENTLY. A Flex's `color` can arrive from
 * legacy prop injection rather than from the call site — `TouchableArea` clones its
 * non-primitive children with a `color: '$neutral1'` default, which an app wrapper
 * forwarding its rest props hands straight to a Flex — so an unmapped token drops the
 * declaration, matching what this prop did before it had a compiler path, instead of
 * throwing mid-render on a colour nobody asked for.
 */
function flexColorClass(value: NonNullable<FlexCompatStyleProps['color']>): string {
  // `resolveColorOrWarn` (not `unwrapVariable`) so a legacy `OpaqueColorValue` (INFRA-3804,
  // `color` is `ColorValue`-typed) drops the declaration instead of compiling
  // `String(value)`'s `"[object Object]"` — same hazard `colorClasses`/`longTailClasses` guard.
  const resolved = resolveColorOrWarn(value)
  if (resolved === undefined) {
    return ''
  }
  const cssValue = resolved.startsWith('$') ? mappedColorTokenCssValue(resolved) : arbitrary(resolved)
  return cssValue === undefined ? '' : `[color:${cssValue}]`
}

/**
 * Compile one Flex style object (no BASE_CLASSES) — the recursive unit.
 * `options` swaps `commonStyleClasses` strategies per lane (the native
 * className lane passes its shadow color policy); the default is the web
 * behavior, so existing callers (TouchableArea's binding included) are
 * byte-identical.
 */
export function flexStyleClasses(
  props: FlexCompatPlatformWebStyleProps,
  options: FlexStyleClassOptions = {},
): string[] {
  const cls: ClassList = [
    ...variantClasses(props, options),
    ...flexboxStyleClasses(props, flexDisplayClass),
    ...commonStyleClasses(props, options),
    // Flex-specific extras with no shared-surface home (INFRA-3808/INFRA-3809) — always
    // arbitrary properties, per their doc comments in ./props.
    props.gridArea !== undefined && `[grid-area:${arbitrary(props.gridArea)}]`,
    props.color !== undefined && flexColorClass(props.color),
    // `textAlign` isn't part of FlexCompatStyleProps — only reachable via the
    // `$platform-web` pool, which carries `InheritedTextStyleProps`
    // (INFRA-3673); it is `undefined` for every other pool this same compiler
    // walks, so the call is a no-op everywhere except that one pool's object.
    // TouchableArea inherits this for free — its compiler delegates to
    // `flexStyleClasses` for the shared surface.
    ...inheritedTextClasses(props),
  ]
  return cls.filter((entry): entry is string => typeof entry === 'string' && entry !== '')
}
