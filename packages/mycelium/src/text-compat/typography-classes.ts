/**
 * The typography half of the TextCompat compiler: variant type ramp,
 * font-relative token resolution, curated text utilities, truncation
 * variants, and text shadows. The view-surface half and pool assembly live in
 * `style-classes.ts`.
 *
 * Values compile to arbitrary-property utilities (`[font-weight:485]`,
 * `[font-family:…]`, `[color:…]`) on purpose: tailwind-merge misclassifies
 * bare `text-(--var)` / `font-(family-name:…)` utilities and silently drops
 * sibling classes, while arbitrary properties group by property name and
 * merge correctly.
 */
import { arbitrary, type ClassList, enumClass } from '../compat/style-classes'
import type { TextCompatStyleProps } from './props'
import {
  colorCssExpression,
  colorPropertyClass,
  FONT_DEFINITIONS,
  FONT_WEIGHT_TOKEN,
  lookupToken,
  VARIANT_METRICS,
} from './tokens'

/** Tamagui font token per Text variant (Text.tsx variant definitions). */
const VARIANT_FONT: Record<string, keyof typeof FONT_DEFINITIONS> = {
  heading1: 'heading',
  heading2: 'heading',
  heading3: 'heading',
  subheading1: 'subHeading',
  subheading2: 'subHeading',
  body1: 'body',
  body2: 'body',
  body3: 'body',
  body4: 'body',
  body5: 'body',
  buttonLabel1: 'button',
  buttonLabel2: 'button',
  buttonLabel3: 'button',
  buttonLabel4: 'button',
  monospace: 'monospace',
}

/** `$body` → `body`; undefined for non-token families. */
function fontTokenName(fontFamily: string | undefined): string | undefined {
  if (fontFamily === undefined || !fontFamily.startsWith('$')) {
    return undefined
  }
  const name = fontFamily.slice(1)
  return name in FONT_DEFINITIONS ? name : undefined
}

/**
 * The font a pool's `$`-relative fontSize/lineHeight tokens resolve against:
 * the pool's own fontFamily token, else its variant's font, else the
 * inherited context (the base pool's font), else `$body` (the Text default).
 */
export function effectiveFontToken(pool: TextCompatStyleProps, inherited?: string): string {
  const own = fontTokenName(pool.fontFamily)
  if (own !== undefined) {
    return own
  }
  if (pool.variant !== undefined) {
    return VARIANT_FONT[pool.variant] ?? 'body'
  }
  return inherited ?? 'body'
}

function fontDefinition(fontToken: string): (typeof FONT_DEFINITIONS)[string] {
  const definition = FONT_DEFINITIONS[fontToken]
  if (definition === undefined) {
    throw new Error(`TextCompat: unknown font token "$${fontToken}"`)
  }
  return definition
}

/** Font-relative token → px, falling back to the Text-variant-named fontSize tokens. */
function resolveFontMetric({
  value,
  fontToken,
  kind,
}: {
  value: string
  fontToken: string
  kind: 'sizes' | 'lineHeights'
}): number {
  const name = value.slice(1)
  const fromFont = fontDefinition(fontToken)[kind][name]
  if (fromFont !== undefined) {
    return fromFont
  }
  const fromVariantTokens = lookupToken(VARIANT_METRICS, name)
  if (fromVariantTokens !== undefined) {
    return kind === 'sizes' ? fromVariantTokens.fontSize : fromVariantTokens.lineHeight
  }
  throw new Error(
    `TextCompat: unknown ${kind === 'sizes' ? 'fontSize' : 'lineHeight'} token "${value}" for font "$${fontToken}"`,
  )
}

function fontSizeClass(fontSize: NonNullable<TextCompatStyleProps['fontSize']>, fontToken: string): string {
  if (typeof fontSize === 'number') {
    return `text-[${fontSize}px]`
  }
  if (fontSize.startsWith('$')) {
    return `text-[${resolveFontMetric({ value: fontSize, fontToken, kind: 'sizes' })}px]`
  }
  return `text-[${arbitrary(fontSize)}]`
}

/**
 * `[line-height:…]` rather than `leading-…`: tailwind-merge declares the
 * font-size group as conflicting with `leading`, so a later `text-[13px]`
 * would silently drop an earlier `leading-[20.8px]` — while Tamagui keeps the
 * variant line-height when only fontSize is overridden.
 */
function lineHeightClass(lineHeight: number | string, fontToken: string): string {
  if (typeof lineHeight === 'number') {
    return `[line-height:${lineHeight}px]`
  }
  if (lineHeight.startsWith('$')) {
    return `[line-height:${resolveFontMetric({ value: lineHeight, fontToken, kind: 'lineHeights' })}px]`
  }
  return `[line-height:${arbitrary(lineHeight)}]`
}

function fontWeightClass(value: NonNullable<TextCompatStyleProps['fontWeight']>): string {
  if (typeof value === 'number') {
    return `[font-weight:${value}]`
  }
  const tokenWeight = lookupToken(FONT_WEIGHT_TOKEN, value.startsWith('$') ? value.slice(1) : value)
  if (tokenWeight !== undefined) {
    return `[font-weight:${tokenWeight}]`
  }
  if (value.startsWith('$')) {
    throw new Error(`TextCompat: unknown fontWeight token "${value}"`)
  }
  return `[font-weight:${arbitrary(value)}]`
}

function fontFamilyClass(value: string): string {
  const token = fontTokenName(value)
  if (token !== undefined) {
    return `[font-family:var(--stext-font-${fontDefinition(token).family})]`
  }
  if (value.startsWith('$')) {
    throw new Error(`TextCompat: unknown fontFamily token "${value}"`)
  }
  return `[font-family:${arbitrary(value)}]`
}

function fontStyleClass(fontStyle: string): string {
  if (fontStyle === 'italic') {
    return 'italic'
  }
  return fontStyle === 'normal' ? 'not-italic' : `[font-style:${fontStyle}]`
}

/**
 * The font-relative size/lineHeight token each variant sets (Text.tsx
 * createTextVariant definitions). `monospace` pins raw numbers instead.
 */
const VARIANT_SIZE_TOKEN: Record<string, string> = {
  heading1: '$large',
  heading2: '$medium',
  heading3: '$small',
  subheading1: '$large',
  subheading2: '$small',
  body1: '$large',
  body2: '$medium',
  body3: '$small',
  body4: '$micro',
  body5: '$nano',
  buttonLabel1: '$large',
  buttonLabel2: '$medium',
  buttonLabel3: '$small',
  buttonLabel4: '$micro',
}

/**
 * Resolve a variant's size/lineHeight token against `fontToken` — normally
 * the variant's own font, but Tamagui resolves font-relative tokens against
 * one global font context per element (see `globalFontToken` in compile.ts),
 * so a fontFamily override or a media pool can re-key the resolution. Falls
 * back to the variant's own pinned metrics when the context font lacks the
 * token (e.g. $nano outside the body font).
 */
function variantMetric({
  variant,
  fontToken,
  kind,
}: {
  variant: keyof typeof VARIANT_METRICS
  fontToken: string
  kind: 'sizes' | 'lineHeights'
}): number {
  const token = VARIANT_SIZE_TOKEN[variant]
  const fallback = kind === 'sizes' ? VARIANT_METRICS[variant].fontSize : VARIANT_METRICS[variant].lineHeight
  if (token === undefined) {
    return fallback
  }
  return fontDefinition(fontToken)[kind][token.slice(1)] ?? fallback
}

/**
 * Variant typography — fontFamily, fontSize, fontWeight, lineHeight, exactly
 * the styles the legacy createTextVariant sets. Emitted first so explicit
 * typography props in the same pool override via tailwind-merge groups.
 * `lineHeight: 'unset'` skips the variant line-height (the legacy Vietnamese
 * diacritics escape hatch).
 */
function variantClasses(pool: TextCompatStyleProps, fontToken: string): ClassList {
  const variant = pool.variant
  if (variant === undefined) {
    return []
  }
  const metrics = VARIANT_METRICS[variant]
  return [
    `[font-family:var(--stext-font-${metrics.family})]`,
    `text-[${variantMetric({ variant, fontToken, kind: 'sizes' })}px]`,
    pool.lineHeight !== 'unset' && `[line-height:${variantMetric({ variant, fontToken, kind: 'lineHeights' })}px]`,
    `[font-weight:${metrics.fontWeight}]`,
  ]
}

function fontClasses(pool: TextCompatStyleProps, fontToken: string): ClassList {
  const { fontFamily, fontSize, fontWeight, fontStyle, letterSpacing, lineHeight } = pool
  return [
    fontFamily !== undefined && fontFamilyClass(fontFamily),
    fontSize !== undefined && fontSizeClass(fontSize, fontToken),
    fontWeight !== undefined && fontWeightClass(fontWeight),
    fontStyle !== undefined && fontStyleClass(fontStyle),
    letterSpacing !== undefined &&
      `[letter-spacing:${typeof letterSpacing === 'number' ? `${letterSpacing}px` : arbitrary(letterSpacing)}]`,
    lineHeight !== undefined && lineHeight !== 'unset' && lineHeightClass(lineHeight, fontToken),
  ]
}

const TEXT_ALIGN_CLASS: Record<string, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
  justify: 'text-justify',
  start: 'text-start',
  end: 'text-end',
}

const TEXT_TRANSFORM_CLASS: Record<string, string> = {
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
  none: 'normal-case',
}

const TEXT_DECORATION_CLASS: Record<string, string> = {
  underline: 'underline',
  'line-through': 'line-through',
  none: 'no-underline',
}

const WHITE_SPACE_CLASS: Record<string, string> = {
  normal: 'whitespace-normal',
  nowrap: 'whitespace-nowrap',
  pre: 'whitespace-pre',
  'pre-line': 'whitespace-pre-line',
  'pre-wrap': 'whitespace-pre-wrap',
  'break-spaces': 'whitespace-break-spaces',
}

function textStyleClasses(pool: TextCompatStyleProps): ClassList {
  const { color, textAlign, textTransform, textDecorationLine, textDecorationColor } = pool
  const { whiteSpace, wordWrap, textOverflow, userSelect, cursor } = pool
  return [
    color !== undefined && colorPropertyClass('color', color),
    textAlign !== undefined && enumClass({ map: TEXT_ALIGN_CLASS, value: textAlign, cssProp: 'text-align' }),
    textTransform !== undefined &&
      enumClass({ map: TEXT_TRANSFORM_CLASS, value: textTransform, cssProp: 'text-transform' }),
    textDecorationLine !== undefined &&
      enumClass({ map: TEXT_DECORATION_CLASS, value: textDecorationLine, cssProp: 'text-decoration-line' }),
    textDecorationColor !== undefined && colorPropertyClass('text-decoration-color', textDecorationColor),
    whiteSpace !== undefined && enumClass({ map: WHITE_SPACE_CLASS, value: whiteSpace, cssProp: 'white-space' }),
    wordWrap !== undefined && `[word-wrap:${wordWrap}]`,
    textOverflow !== undefined &&
      (textOverflow === 'ellipsis' ? 'text-ellipsis' : textOverflow === 'clip' ? 'text-clip' : '[text-overflow:unset]'),
    userSelect !== undefined && `[user-select:${userSelect}]`,
    cursor !== undefined && `[cursor:${arbitrary(cursor)}]`,
  ]
}

/** Tamagui Text `numberOfLines: 1` / `ellipse` / `ellipsis` styles. */
const SINGLE_LINE_ELLIPSIS = ['max-w-full', 'overflow-hidden', 'text-ellipsis', 'whitespace-nowrap']

/** Tamagui Text variants: numberOfLines / ellipse / ellipsis / selectable. */
function truncationClasses(pool: TextCompatStyleProps): ClassList {
  const cls: ClassList = []
  if (pool.numberOfLines === 1 || pool.ellipse === true || pool.ellipsis === true) {
    cls.push(...SINGLE_LINE_ELLIPSIS)
  } else if (pool.numberOfLines !== undefined && pool.numberOfLines > 1) {
    cls.push(
      `[-webkit-line-clamp:${pool.numberOfLines}]`,
      '[-webkit-box-orient:vertical]',
      '[display:-webkit-box]',
      'overflow-hidden',
    )
  }
  if (pool.selectable !== undefined) {
    cls.push(
      pool.selectable ? '[user-select:text]' : '[user-select:none]',
      pool.selectable ? '[cursor:text]' : '[cursor:default]',
    )
  }
  return cls
}

/** Text shadow, composed like Tamagui web: `<x>px <y>px <radius>px <color>`. */
function textShadowClasses(pool: TextCompatStyleProps): ClassList {
  const { textShadowColor, textShadowOffset, textShadowRadius } = pool
  if (textShadowColor === undefined && textShadowOffset === undefined && textShadowRadius === undefined) {
    return []
  }
  const offset = textShadowOffset ?? { width: 0, height: 0 }
  const radius = textShadowRadius ?? 0
  const shadowColor = colorCssExpression(textShadowColor ?? '#000000')
  return [`[text-shadow:${arbitrary(`${offset.width}px ${offset.height}px ${radius}px ${shadowColor}`)}]`]
}

/** Compile the full typography surface of one pool. */
export function typographyClasses(pool: TextCompatStyleProps, fontToken: string): ClassList {
  return [
    ...variantClasses(pool, fontToken),
    ...fontClasses(pool, fontToken),
    ...textStyleClasses(pool),
    ...truncationClasses(pool),
    ...textShadowClasses(pool),
  ]
}
