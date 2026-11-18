/**
 * The component-agnostic per-style-object compiler: turns one flat style
 * object (the universal `CompatStyleProps` surface — margin/padding, sizing,
 * visuals, positioning, transforms, shadows, and the long tail) into Tailwind
 * utility classes. Each migrated component composes `commonStyleClasses` with
 * its own layout classes (e.g. flexbox) and frame defaults.
 */
import { borderWidthPx, isCssLengthPassthroughValue, sizeValue, spacePx, spaceTokenPx, zIndexValue } from './css-values'
import { borderColorDropClasses, unmappedColorTokenClasses } from './diagnostics'
import type {
  ColorValue,
  CompatStyleProps,
  InsetShorthand,
  PositionValue,
  SizeValue,
  SpaceValue,
  TamaguiVariable,
} from './props'
import {
  ANIMATION_LONG_TAIL_PROPS,
  assertAnimationValue,
  COLOR_LONG_TAIL_PROPS,
  cssPropertyName,
  LONG_TAIL_STYLE_PROPS,
  POINTER_EVENTS_BOX_CLASSES,
  RADIUS_LONG_TAIL_PROPS,
  SIZE_LONG_TAIL_PROPS,
  SPACE_LONG_TAIL_PROPS,
  SPACING_UTILITIES,
  UNITLESS_STYLE_PROPS,
} from './style-props'
import {
  arbitrary,
  COLOR_TOKEN_CLASS,
  colorTokenCssValue,
  isTamaguiVariable,
  lookupToken,
  radiusPx,
  resolveColorOrWarn,
  shadowColorExpressionOrUndefined,
  THEMED_COLOR_TOKEN_CLASSES,
  unwrapVariable,
} from './tokens'

export type ClassList = (string | false | undefined)[]

/** The generic reset every compat component's frame includes (Tamagui `View` base). */
export const RESET_CLASSES = 'box-border relative min-h-[0px] min-w-[0px]'

// Value resolvers live beside the value-leg types (css-values.ts); re-exported
// here so compilers keep one import surface.
export { borderWidthPx, isCssPassthroughValue, sizeValue, spacePx, zIndexValue } from './css-values'
export { arbitrary, outlineColorClasses } from './tokens'

export function colorClasses(prefix: 'bg' | 'border', value: ColorValue): ClassList {
  // `resolveColorOrWarn` (not `unwrapVariable`) so a legacy `OpaqueColorValue`
  // (INFRA-3804) drops the declaration instead of compiling `String(value)`'s
  // `"[object Object]"` into a nonsense arbitrary class.
  const resolved = resolveColorOrWarn(value)
  if (resolved === undefined) {
    return []
  }
  const semantic = lookupToken(COLOR_TOKEN_CLASS, resolved)
  if (semantic !== undefined) {
    return [`${prefix}-${semantic}`]
  }
  const themed = lookupToken(THEMED_COLOR_TOKEN_CLASSES, resolved)
  if (themed !== undefined) {
    return [`${prefix}-${themed.light}`, `dark:${prefix}-${themed.dark}`]
  }
  if (resolved.startsWith('$')) {
    return unmappedColorTokenClasses(prefix, resolved) // resolution + warning: ./diagnostics
  }
  return [`${prefix}-[${arbitrary(resolved)}]`]
}

/**
 * Per-component strategy hooks for `commonStyleClasses`. The defaults are the
 * Flex behavior (semantic color utilities, the shared long-tail tables); Text
 * swaps in its pinned-var color model and its text-extended long tail.
 */
export interface CommonStyleClassOptions {
  colorClasses?: (prefix: 'bg' | 'border', value: ColorValue) => ClassList
  /** `undefined` drops the composed box-shadow declaration (the native lane's resolve-or-drop policy); the default web lane throws instead. */
  shadowColorExpression?: (value: ColorValue) => string | undefined
  /** Long-tail `$` color resolution — per consumer like `colorClasses` (Text swaps in its pinned `--stext-*` palette). */
  longTailColorExpression?: (value: string, prop: string) => string
  longTailProps?: readonly string[]
  unitlessProps?: ReadonlySet<string>
}

/** Values outside a utility map (`unset`) fall back to arbitrary properties. */
export function enumClass({
  map,
  value,
  cssProp,
}: {
  map: Record<string, string>
  value: string
  cssProp: string
}): string {
  return map[value] ?? `[${cssProp}:${value}]`
}

function spacingClasses(props: CompatStyleProps): ClassList {
  const cls: ClassList = []
  for (const [utility, shorthand, longhand] of SPACING_UTILITIES) {
    // Longhand first: Tamagui resolves shorthands on top of longhands.
    for (const key of [longhand, shorthand]) {
      const value = props[key]
      // `null` is a legal SpaceValue (INFRA-3821) meaning "not set", same as `undefined`.
      if (value !== undefined && value !== null) {
        cls.push(`${utility}-[${spacePx(value)}]`)
      }
    }
  }
  return cls
}

function sizingClasses(props: CompatStyleProps): ClassList {
  const sizeClass = (prefix: string, value: SizeValue | undefined): string | false =>
    value !== undefined && `${prefix}-[${arbitrary(sizeValue(value))}]`
  return [
    sizeClass('w', props.width),
    sizeClass('h', props.height),
    sizeClass('min-w', props.minWidth),
    sizeClass('min-h', props.minHeight),
    sizeClass('max-w', props.maxWidth),
    sizeClass('max-h', props.maxHeight),
  ]
}

/**
 * `borderRadius` → one `rounded-*` class: `$rounded*` token / number → exact px
 * off `RADIUS_TOKEN_PX` (unknown token → throw, the shared token contract),
 * CSS pass-through strings verbatim. Exported for the per-component lanes that
 * compile borderRadius outside `commonStyleClasses` (ButtonCompat's dimension
 * lane, INFRA-3541).
 */
export function radiusClass(borderRadius: NonNullable<CompatStyleProps['borderRadius']>): string {
  const resolved = unwrapVariable(borderRadius)
  if (typeof resolved === 'string' && !resolved.startsWith('$') && isCssLengthPassthroughValue(resolved)) {
    return `rounded-[${arbitrary(resolved)}]`
  }
  return `rounded-[${radiusPx(resolved, 'borderRadius')}px]`
}

function visualClasses(props: CompatStyleProps, options: CommonStyleClassOptions): ClassList {
  const { backgroundColor, borderColor, borderWidth, borderRadius, opacity, overflow } = props
  const color = options.colorClasses ?? colorClasses
  return [
    ...(backgroundColor !== undefined ? color('bg', backgroundColor) : []),
    ...borderColorDropClasses(borderColor === undefined ? undefined : color('border', borderColor), props),
    borderWidth !== undefined && `border-[${borderWidthPx(borderWidth)}]`,
    // Per-side widths use the side utilities: like Tamagui, they set the side's border-style (solid) with the width.
    props.borderTopWidth !== undefined && `border-t-[${borderWidthPx(props.borderTopWidth)}]`,
    props.borderBottomWidth !== undefined && `border-b-[${borderWidthPx(props.borderBottomWidth)}]`,
    props.borderLeftWidth !== undefined && `border-l-[${borderWidthPx(props.borderLeftWidth)}]`,
    props.borderRightWidth !== undefined && `border-r-[${borderWidthPx(props.borderRightWidth)}]`,
    borderRadius !== undefined && radiusClass(borderRadius),
    opacity !== undefined && `opacity-[${opacity}]`,
    overflow !== undefined && (overflow === 'unset' ? '[overflow:unset]' : `overflow-${overflow}`),
  ]
}

export const POSITION_CLASS: Record<string, string> = {
  absolute: 'absolute',
  relative: 'relative',
  static: 'static',
  fixed: 'fixed',
  sticky: 'sticky',
}

/**
 * The `position`/`top` pair, shared with `ButtonCompat`'s visual-props widening
 * (`../button-compat/visual-props`) so the two stay in sync as one copy.
 */
export function positionAndTopClasses(position: PositionValue | undefined, top: SpaceValue | undefined): ClassList {
  return [
    position !== undefined && (POSITION_CLASS[position] ?? `[position:${arbitrary(position)}]`),
    // `null` is a legal SpaceValue (INFRA-3821) meaning "not set", same as `undefined`.
    top !== undefined && top !== null && `top-[${spacePx(top)}]`,
  ]
}

function positionClasses({ position, top, right, bottom, left, zIndex }: CompatStyleProps): ClassList {
  return [
    ...positionAndTopClasses(position, top),
    right !== undefined && right !== null && `right-[${spacePx(right)}]`,
    bottom !== undefined && bottom !== null && `bottom-[${spacePx(bottom)}]`,
    left !== undefined && left !== null && `left-[${spacePx(left)}]`,
    zIndex !== undefined && `z-[${zIndexValue(zIndex)}]`,
  ]
}

/** Tamagui web emits `inset` as top/right/bottom/left longhands (measured; identical for Flex and the plain View). */
export function insetClasses(inset: SpaceValue | InsetShorthand | undefined): ClassList {
  // `null` is a legal SpaceValue (INFRA-3821) meaning "not set", same as `undefined` — and
  // `typeof null === 'object'` would otherwise fall into the edge-map branch below.
  if (inset === undefined || inset === null) {
    return []
  }
  // A Variable is an object too — but it is a space VALUE for all four edges, not an edge map.
  const box: InsetShorthand =
    typeof inset === 'object' && !isTamaguiVariable(inset)
      ? inset
      : { top: inset, right: inset, bottom: inset, left: inset }
  return [
    box.top !== undefined && box.top !== null && `top-[${spacePx(box.top)}]`,
    box.right !== undefined && box.right !== null && `right-[${spacePx(box.right)}]`,
    box.bottom !== undefined && box.bottom !== null && `bottom-[${spacePx(box.bottom)}]`,
    box.left !== undefined && box.left !== null && `left-[${spacePx(box.left)}]`,
  ]
}

// ── Transforms ─────────────────────────────────────────────────────────

const TRANSFORM_PROPS = [
  'x',
  'y',
  'scale',
  'scaleX',
  'scaleY',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'skewX',
  'skewY',
  'perspective',
  'matrix',
] as const

const TRANSFORM_FUNCTION_NAME: Record<string, string> = {
  x: 'translateX',
  y: 'translateY',
}

// RN-keyed translate entries are px like x/y: a unitless translateY(-8) voids the whole transform.
const PX_TRANSFORMS = new Set(['x', 'y', 'translateX', 'translateY', 'translateZ', 'perspective'])

function transformFunction(prop: string, value: string | number | readonly number[] | TamaguiVariable): string {
  const name = TRANSFORM_FUNCTION_NAME[prop] ?? prop
  if (prop === 'matrix') {
    return `matrix(${(value as readonly number[]).join(',')})`
  }
  const argument = PX_TRANSFORMS.has(prop) ? sizeValue(value as SizeValue) : String(value)
  return `${name}(${argument})`
}

/**
 * Compose the merged `transform` declaration the way Tamagui does on web: transform-prop entries sort ascending by
 * prop name and are prepended one by one, so the emitted function order is descending by prop name (y before x before
 * scale before rotate). An explicit `transform` array appends after the merged props; a string replaces everything.
 */
function transformValue(props: CompatStyleProps): string | undefined {
  if (typeof props.transform === 'string') {
    return props.transform
  }
  const parts: string[] = []
  const present = TRANSFORM_PROPS.filter((prop) => props[prop] !== undefined).sort()
  for (const prop of present) {
    parts.unshift(transformFunction(prop, props[prop] as string | number | readonly number[] | TamaguiVariable))
  }
  if (props.transform !== undefined) {
    for (const entry of props.transform) {
      const [name] = Object.keys(entry)
      if (name !== undefined) {
        parts.push(transformFunction(name, entry[name] as string | number | readonly number[]))
      }
    }
  }
  if (parts.length === 0) {
    return undefined
  }
  return parts.join(' ')
}

function transformClasses(props: CompatStyleProps): ClassList {
  const value = transformValue(props)
  const cls: ClassList = [value !== undefined && `[transform:${arbitrary(value)}]`]
  if (props.transformOrigin !== undefined) {
    cls.push(`[transform-origin:${arbitrary(props.transformOrigin)}]`)
  }
  return cls
}

// ── Shadows ────────────────────────────────────────────────────────────

/**
 * Throwing lane of `shadowColorExpressionOrUndefined` (tokens.ts) for the web
 * compiler. `undefined` also covers the OpaqueColorValue drop case
 * (INFRA-3804) — already warned once there — so this still throws for it: a
 * shadow color has no CSS representation for `PlatformColor()`, unlike
 * backgroundColor/borderColor's native style-object passthrough.
 */
function shadowColorExpression(value: ColorValue): string {
  const resolved = shadowColorExpressionOrUndefined(value)
  if (resolved === undefined) {
    throw new Error(`compat: shadow color token "${String(value)}" has no @universe/tailwind counterpart`)
  }
  return resolved
}

/**
 * Compose the `box-shadow` declaration the way Tamagui does on web:
 * `<x>px <y>px <radius>px <color>`, with `shadowOpacity` folded in via
 * `color-mix(in srgb, <color> <opacity·100>%, transparent)`.
 */
function shadowClasses(props: CompatStyleProps, options: CommonStyleClassOptions): ClassList {
  const { shadowColor, shadowOffset, shadowOpacity, shadowRadius, boxShadow } = props
  const cls: ClassList = [boxShadow !== undefined && `[box-shadow:${arbitrary(boxShadow)}]`]
  if (shadowColor === undefined && shadowOffset === undefined && shadowRadius === undefined) {
    return cls
  }
  const offsetX = borderWidthPx(shadowOffset?.width ?? 0)
  const offsetY = borderWidthPx(shadowOffset?.height ?? 0)
  const radius = borderWidthPx(shadowRadius ?? 0)
  const baseColor = (options.shadowColorExpression ?? shadowColorExpression)(shadowColor ?? '#000000')
  if (baseColor === undefined) {
    // The consumer's resolver dropped the token — no declaration beats a wrong-colored shadow.
    return cls
  }
  const color =
    shadowOpacity !== undefined ? `color-mix(in srgb, ${baseColor} ${shadowOpacity * 100}%, transparent)` : baseColor
  cls.push(`[box-shadow:${arbitrary(`${offsetX} ${offsetY} ${radius} ${color}`)}]`)
  return cls
}

// ── Long tail ──────────────────────────────────────────────────────────

/**
 * Resolve a `$` token on a non-color long-tail prop through its token family
 * (radius/space/size), matching the shorthand resolvers; errors name the
 * longhand. The COLOR family is resolved by the caller before this is reached
 * (see the `COLOR_LONG_TAIL_PROPS` branch in `longTailClasses`).
 * `long-tail-token-coverage.test.ts` pins the partition.
 */
function longTailTokenValue(prop: string, value: string): string {
  if (RADIUS_LONG_TAIL_PROPS.has(prop)) {
    return `${radiusPx(value, prop)}px`
  }
  if (SPACE_LONG_TAIL_PROPS.has(prop)) {
    return spaceTokenPx(value, prop)
  }
  if (SIZE_LONG_TAIL_PROPS.has(prop)) {
    return sizeValue(value, prop)
  }
  throw new Error(`compat: token value "${value}" for "${prop}" has no @universe/tailwind counterpart`)
}

function longTailClasses(props: CompatStyleProps, options: CommonStyleClassOptions): ClassList {
  const cls: ClassList = []
  const unitless = options.unitlessProps ?? UNITLESS_STYLE_PROPS
  // Per-consumer color model, defaulting to the Flex semantic tables — so
  // Text's pinned palette covers its color longhands like its shorthands.
  const colorValue = options.longTailColorExpression ?? colorTokenCssValue
  for (const prop of options.longTailProps ?? LONG_TAIL_STYLE_PROPS) {
    const raw = props[prop as keyof CompatStyleProps] as string | number | TamaguiVariable | undefined
    if (raw === undefined) {
      continue
    }
    if (COLOR_LONG_TAIL_PROPS.has(prop)) {
      // `resolveColorOrWarn` (not `unwrapVariable`) so a legacy `OpaqueColorValue` reaching
      // this prop (INFRA-3804) drops the declaration instead of `unwrapVariable` passing it
      // through unchanged into `String(value)` below, which would compile the literal string
      // "[object Object]" into a nonsense arbitrary class — the same hazard `colorClasses` guards.
      const resolved = resolveColorOrWarn(raw as ColorValue)
      if (resolved === undefined) {
        continue
      }
      const resolvedClass = resolved.startsWith('$') ? colorValue(resolved, prop) : arbitrary(resolved)
      cls.push(`[${cssPropertyName(prop)}:${resolvedClass}]`)
      continue
    }
    const value = unwrapVariable(raw)
    if (ANIMATION_LONG_TAIL_PROPS.has(prop)) {
      assertAnimationValue(prop, value)
    }
    if (prop === 'pointerEvents' && typeof value === 'string' && Object.hasOwn(POINTER_EVENTS_BOX_CLASSES, value)) {
      const boxClasses = POINTER_EVENTS_BOX_CLASSES[value]
      if (boxClasses !== undefined) {
        cls.push(...boxClasses)
      }
      continue
    }
    if (typeof value === 'string' && value.startsWith('$')) {
      cls.push(`[${cssPropertyName(prop)}:${longTailTokenValue(prop, value)}]`)
      continue
    }
    const cssValue = typeof value === 'number' && !unitless.has(prop) ? `${value}px` : String(value)
    cls.push(`[${cssPropertyName(prop)}:${arbitrary(cssValue)}]`)
  }
  return cls
}

/**
 * Compile the universal style surface of one style object. Component compilers
 * prepend their own layout classes (e.g. flexbox) and frame defaults.
 */
export function commonStyleClasses(props: CompatStyleProps, options: CommonStyleClassOptions = {}): ClassList {
  return [
    ...spacingClasses(props),
    ...sizingClasses(props),
    ...visualClasses(props, options),
    ...positionClasses(props),
    ...transformClasses(props),
    ...shadowClasses(props, options),
    ...longTailClasses(props, options),
  ]
}

// ── Flexbox ────────────────────────────────────────────────────────────

export const DIRECTION_CLASS: Record<string, string> = {
  row: 'flex-row',
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
}

export const ALIGN_ITEMS_CLASS: Record<string, string> = {
  stretch: 'items-stretch',
  'flex-start': 'items-start',
  'flex-end': 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
}

export const ALIGN_SELF_CLASS: Record<string, string> = {
  auto: 'self-auto',
  stretch: 'self-stretch',
  'flex-start': 'self-start',
  'flex-end': 'self-end',
  center: 'self-center',
  baseline: 'self-baseline',
}

export const JUSTIFY_CLASS: Record<string, string> = {
  'flex-start': 'justify-start',
  'flex-end': 'justify-end',
  center: 'justify-center',
  'space-between': 'justify-between',
  'space-around': 'justify-around',
  'space-evenly': 'justify-evenly',
}

export const WRAP_CLASS: Record<string, string> = {
  nowrap: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
}

/** The flexbox style-prop slice both Flex and Text compile (structural). */
export interface FlexboxStyleValues {
  flexDirection?: string
  alignItems?: string
  alignSelf?: string
  justifyContent?: string
  flexWrap?: string
  flex?: number
  flexBasis?: SizeValue
  flexGrow?: number
  flexShrink?: number
  display?: string
  gap?: SpaceValue
  rowGap?: SpaceValue
  columnGap?: SpaceValue
}

/**
 * Compile the shared flexbox surface. `displayClass` is per component: Flex
 * maps display values to utilities, Text always emits an arbitrary property so
 * every display value shares one tailwind-merge group.
 */
export function flexboxStyleClasses(props: FlexboxStyleValues, displayClass: (value: string) => string): ClassList {
  const { flexDirection, alignItems, alignSelf, justifyContent, flexWrap, display } = props
  const { flex, flexBasis, flexGrow, flexShrink, gap, rowGap, columnGap } = props
  const cls: ClassList = [
    flexDirection !== undefined && enumClass({ map: DIRECTION_CLASS, value: flexDirection, cssProp: 'flex-direction' }),
    alignItems !== undefined && enumClass({ map: ALIGN_ITEMS_CLASS, value: alignItems, cssProp: 'align-items' }),
    alignSelf !== undefined && enumClass({ map: ALIGN_SELF_CLASS, value: alignSelf, cssProp: 'align-self' }),
    justifyContent !== undefined &&
      enumClass({ map: JUSTIFY_CLASS, value: justifyContent, cssProp: 'justify-content' }),
    flexWrap !== undefined && enumClass({ map: WRAP_CLASS, value: flexWrap, cssProp: 'flex-wrap' }),
    display !== undefined && displayClass(display),
    flexBasis !== undefined && `basis-[${arbitrary(sizeValue(flexBasis))}]`,
    flexGrow !== undefined && `grow-[${flexGrow}]`,
    flexShrink !== undefined && `shrink-[${flexShrink}]`,
    gap !== undefined && gap !== null && `gap-[${spacePx(gap)}]`,
    rowGap !== undefined && rowGap !== null && `gap-y-[${spacePx(rowGap)}]`,
    columnGap !== undefined && columnGap !== null && `gap-x-[${spacePx(columnGap)}]`,
  ]
  if (flex !== undefined) {
    // Tamagui web keeps flex-basis:auto for numeric `flex` (not the CSS
    // shorthand, whose basis is 0%) — emit the longhands.
    cls.push(`grow-[${flex}]`, 'shrink')
  }
  return cls
}
