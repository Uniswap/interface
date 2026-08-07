/**
 * The component-agnostic per-style-object compiler: turns one flat style
 * object (the universal `CompatStyleProps` surface — margin/padding, sizing,
 * visuals, positioning, transforms, shadows, and the long tail) into Tailwind
 * utility classes. Each migrated component composes `commonStyleClasses` with
 * its own layout classes (e.g. flexbox) and frame defaults.
 */
import type { ColorValue, CompatStyleProps, InsetShorthand, SizeValue, SpaceValue } from './props'
import { cssPropertyName, LONG_TAIL_STYLE_PROPS, UNITLESS_STYLE_PROPS } from './style-props'
import { COLOR_TOKEN_CLASS, lookupToken, RADIUS_TOKEN_PX, SPACE_TOKEN_PX, THEMED_COLOR_TOKEN_CLASSES } from './tokens'

export type ClassList = (string | false | undefined)[]

/** The generic reset every compat component's frame includes (Tamagui `View` base). */
export const RESET_CLASSES = 'box-border relative min-h-[0px] min-w-[0px]'

export function spacePx(value: SpaceValue): string {
  if (typeof value === 'number') {
    return `${value}px`
  }
  if (value === 'auto' || value.endsWith('%')) {
    return value
  }
  const px = lookupToken(SPACE_TOKEN_PX, value)
  if (px === undefined) {
    throw new Error(`compat: unknown space token "${value}"`)
  }
  return `${px}px`
}

export function sizeValue(value: SizeValue): string {
  if (typeof value === 'number') {
    return `${value}px`
  }
  if (value.startsWith('$')) {
    const px = lookupToken(SPACE_TOKEN_PX, value)
    if (px === undefined) {
      throw new Error(`compat: unknown size token "${value}"`)
    }
    return `${px}px`
  }
  return value
}

/** Arbitrary values can't contain spaces — Tailwind's syntax uses `_` instead. */
export function arbitrary(value: string): string {
  return value.replace(/\s+/g, '_')
}

export function colorClasses(prefix: 'bg' | 'border', value: ColorValue): ClassList {
  const semantic = lookupToken(COLOR_TOKEN_CLASS, value)
  if (semantic !== undefined) {
    return [`${prefix}-${semantic}`]
  }
  const themed = lookupToken(THEMED_COLOR_TOKEN_CLASSES, value)
  if (themed !== undefined) {
    return [`${prefix}-${themed.light}`, `dark:${prefix}-${themed.dark}`]
  }
  if (value.startsWith('$')) {
    throw new Error(`compat: color token "${value}" has no @universe/tailwind counterpart`)
  }
  return [`${prefix}-[${arbitrary(value)}]`]
}

/**
 * Per-component strategy hooks for `commonStyleClasses`. The defaults are the
 * Flex behavior (semantic color utilities, the shared long-tail tables); Text
 * swaps in its pinned-var color model and its text-extended long tail.
 */
export interface CommonStyleClassOptions {
  colorClasses?: (prefix: 'bg' | 'border', value: ColorValue) => ClassList
  shadowColorExpression?: (value: ColorValue) => string
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

const SPACING_UTILITIES = [
  ['m', 'm', 'margin'],
  ['mx', 'mx', 'marginHorizontal'],
  ['my', 'my', 'marginVertical'],
  ['mt', 'mt', 'marginTop'],
  ['mb', 'mb', 'marginBottom'],
  ['ml', 'ml', 'marginLeft'],
  ['mr', 'mr', 'marginRight'],
  ['p', 'p', 'padding'],
  ['px', 'px', 'paddingHorizontal'],
  ['py', 'py', 'paddingVertical'],
  ['pt', 'pt', 'paddingTop'],
  ['pb', 'pb', 'paddingBottom'],
  ['pl', 'pl', 'paddingLeft'],
  ['pr', 'pr', 'paddingRight'],
] as const

function spacingClasses(props: CompatStyleProps): ClassList {
  const cls: ClassList = []
  for (const [utility, shorthand, longhand] of SPACING_UTILITIES) {
    // Longhand first: Tamagui resolves shorthands on top of longhands.
    for (const key of [longhand, shorthand]) {
      const value = props[key]
      if (value !== undefined) {
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

function radiusClass(borderRadius: NonNullable<CompatStyleProps['borderRadius']>): string {
  const radiusPx = typeof borderRadius === 'number' ? borderRadius : lookupToken(RADIUS_TOKEN_PX, borderRadius)
  if (radiusPx === undefined) {
    throw new Error(`compat: unknown radius token "${String(borderRadius)}"`)
  }
  return `rounded-[${radiusPx}px]`
}

function visualClasses(props: CompatStyleProps, options: CommonStyleClassOptions): ClassList {
  const { backgroundColor, borderColor, borderWidth, borderRadius, opacity, overflow } = props
  const color = options.colorClasses ?? colorClasses
  return [
    ...(backgroundColor !== undefined ? color('bg', backgroundColor) : []),
    ...(borderColor !== undefined ? color('border', borderColor) : []),
    borderWidth !== undefined && `border-[${borderWidth}px]`,
    // Per-side widths use the side utilities: like Tamagui, they set the
    // side's border-style (solid) along with its width.
    props.borderTopWidth !== undefined && `border-t-[${props.borderTopWidth}px]`,
    props.borderBottomWidth !== undefined && `border-b-[${props.borderBottomWidth}px]`,
    props.borderLeftWidth !== undefined && `border-l-[${props.borderLeftWidth}px]`,
    props.borderRightWidth !== undefined && `border-r-[${props.borderRightWidth}px]`,
    borderRadius !== undefined && radiusClass(borderRadius),
    opacity !== undefined && `opacity-[${opacity}]`,
    overflow !== undefined && (overflow === 'unset' ? '[overflow:unset]' : `overflow-${overflow}`),
  ]
}

const POSITION_CLASS: Record<string, string> = {
  absolute: 'absolute',
  relative: 'relative',
  static: 'static',
  fixed: 'fixed',
  sticky: 'sticky',
}

function positionClasses({ position, top, right, bottom, left, zIndex }: CompatStyleProps): ClassList {
  return [
    position !== undefined && (POSITION_CLASS[position] ?? `[position:${position}]`),
    top !== undefined && `top-[${spacePx(top)}]`,
    right !== undefined && `right-[${spacePx(right)}]`,
    bottom !== undefined && `bottom-[${spacePx(bottom)}]`,
    left !== undefined && `left-[${spacePx(left)}]`,
    zIndex !== undefined && `z-[${zIndex}]`,
  ]
}

/** Tamagui web emits `inset` as top/right/bottom/left longhands (measured; identical for Flex and the plain View). */
export function insetClasses(inset: SpaceValue | InsetShorthand | undefined): ClassList {
  if (inset === undefined) {
    return []
  }
  const box: InsetShorthand =
    typeof inset === 'object' ? inset : { top: inset, right: inset, bottom: inset, left: inset }
  return [
    box.top !== undefined && `top-[${spacePx(box.top)}]`,
    box.right !== undefined && `right-[${spacePx(box.right)}]`,
    box.bottom !== undefined && `bottom-[${spacePx(box.bottom)}]`,
    box.left !== undefined && `left-[${spacePx(box.left)}]`,
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

const PX_TRANSFORMS = new Set(['x', 'y', 'perspective'])

function transformFunction(prop: string, value: string | number | readonly number[]): string {
  const name = TRANSFORM_FUNCTION_NAME[prop] ?? prop
  if (prop === 'matrix') {
    return `matrix(${(value as readonly number[]).join(',')})`
  }
  const argument = typeof value === 'number' && PX_TRANSFORMS.has(prop) ? `${value}px` : String(value)
  return `${name}(${argument})`
}

/**
 * Compose the merged `transform` declaration the way Tamagui does on web:
 * transform-prop entries sort ascending by prop name and are prepended one by
 * one, so the emitted function order is descending by prop name (y before x
 * before scale before rotate). An explicit `transform` array appends in array
 * order after the merged props; a `transform` string replaces everything.
 */
function transformValue(props: CompatStyleProps): string | undefined {
  if (typeof props.transform === 'string') {
    return props.transform
  }
  const parts: string[] = []
  const present = TRANSFORM_PROPS.filter((prop) => props[prop] !== undefined).sort()
  for (const prop of present) {
    parts.unshift(transformFunction(prop, props[prop] as string | number | readonly number[]))
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

/** Resolve a shadow color to a CSS expression (var for semantic tokens, raw otherwise). */
function shadowColorExpression(value: ColorValue): string {
  const semantic = lookupToken(COLOR_TOKEN_CLASS, value)
  if (semantic === 'white' || semantic === 'black' || semantic === 'transparent') {
    return `var(--color-${semantic})`
  }
  if (semantic !== undefined) {
    return `var(--${semantic})`
  }
  if (value.startsWith('$')) {
    throw new Error(`compat: shadow color token "${value}" has no @universe/tailwind counterpart`)
  }
  return value
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
  const offset = shadowOffset ?? { width: 0, height: 0 }
  const radius = shadowRadius ?? 0
  const baseColor = (options.shadowColorExpression ?? shadowColorExpression)(shadowColor ?? '#000000')
  const color =
    shadowOpacity !== undefined ? `color-mix(in srgb, ${baseColor} ${shadowOpacity * 100}%, transparent)` : baseColor
  cls.push(`[box-shadow:${arbitrary(`${offset.width}px ${offset.height}px ${radius}px ${color}`)}]`)
  return cls
}

// ── Long tail ──────────────────────────────────────────────────────────

function longTailClasses(props: CompatStyleProps, options: CommonStyleClassOptions): ClassList {
  const cls: ClassList = []
  const unitless = options.unitlessProps ?? UNITLESS_STYLE_PROPS
  for (const prop of options.longTailProps ?? LONG_TAIL_STYLE_PROPS) {
    const value = props[prop as keyof CompatStyleProps] as string | number | undefined
    if (value === undefined) {
      continue
    }
    if (typeof value === 'string' && value.startsWith('$')) {
      throw new Error(`compat: token value "${value}" for "${prop}" has no @universe/tailwind counterpart`)
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

const DIRECTION_CLASS: Record<string, string> = {
  row: 'flex-row',
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
}

const ALIGN_ITEMS_CLASS: Record<string, string> = {
  stretch: 'items-stretch',
  'flex-start': 'items-start',
  'flex-end': 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
}

const ALIGN_SELF_CLASS: Record<string, string> = {
  auto: 'self-auto',
  stretch: 'self-stretch',
  'flex-start': 'self-start',
  'flex-end': 'self-end',
  center: 'self-center',
  baseline: 'self-baseline',
}

const JUSTIFY_CLASS: Record<string, string> = {
  'flex-start': 'justify-start',
  'flex-end': 'justify-end',
  center: 'justify-center',
  'space-between': 'justify-between',
  'space-around': 'justify-around',
  'space-evenly': 'justify-evenly',
}

const WRAP_CLASS: Record<string, string> = {
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
    gap !== undefined && `gap-[${spacePx(gap)}]`,
    rowGap !== undefined && `gap-y-[${spacePx(rowGap)}]`,
    columnGap !== undefined && `gap-x-[${spacePx(columnGap)}]`,
  ]
  if (flex !== undefined) {
    // Tamagui web keeps flex-basis:auto for numeric `flex` (not the CSS
    // shorthand, whose basis is 0%) — emit the longhands.
    cls.push(`grow-[${flex}]`, 'shrink')
  }
  return cls
}
