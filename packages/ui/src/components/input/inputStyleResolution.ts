import { isWebPlatform } from '@universe/environment'
/**
 * Style resolution for the Tamagui-free Input rebuild (INFRA-3318): the legacy Tamagui Input
 * cascade transcribed into token → concrete-value resolution helpers shared by the web and
 * native legs in ./Input.tsx.
 */
import { type UseSporeColorsReturn } from '@universe/mycelium/theme-hooks-compat'
import { type DimensionValue, type StyleProp, StyleSheet, type TextStyle } from 'react-native'
import {
  type ColorTokenValue,
  type FontFamilyTokenValue,
  fontFamilyTokens,
  type InputStyleProps,
  omitStyleProps,
  pickStyleProps,
  type RadiusTokenValue,
  type SpaceTokenValue,
  spacingTokens,
  WEB_ONLY_STYLE_KEYS,
} from 'ui/src/components/input/inputStyleProps'
import { borderRadii, BUTTON_MEDIUM_WEIGHT, defaultWeights, fonts, spacing } from 'ui/src/theme'

// Re-exported so the component and consumers keep one import surface for the style system.
export {
  type ColorTokenValue,
  type FontFamilyTokenValue,
  type InputStyleProps,
  omitStyleProps,
  pickStyleProps,
  type RadiusTokenValue,
  type SpaceTokenValue,
  STYLE_PROP_KEYS,
} from 'ui/src/components/input/inputStyleProps'

function resolveSpace(
  value: SpaceTokenValue | DimensionValue | (string & {}) | null | undefined,
): DimensionValue | undefined {
  if (value === null) {
    return undefined
  }
  if (typeof value !== 'string' || !value.startsWith('$')) {
    return value as DimensionValue | undefined
  }
  return spacingTokens[value.slice(1) as keyof typeof spacingTokens]
}

function resolveRadius(value: RadiusTokenValue | undefined): number | string | undefined {
  if (typeof value !== 'string' || !value.startsWith('$')) {
    // Non-token strings ("50%") pass through instead of indexing borderRadii with a bad key.
    return value
  }
  return borderRadii[value.slice(1) as keyof typeof borderRadii]
}

function resolveFontFamily(value: FontFamilyTokenValue | undefined): string | undefined {
  if (value === undefined || !value.startsWith('$')) {
    return value
  }
  const stack = (fontFamilyTokens as Record<string, string | undefined>)[value.slice(1)]
  return stack ?? value
}

type FontFamilyKey = keyof typeof fontFamilyTokens

// Per-family `$size` token → font-size scales, transcribed from the Tamagui font assembly
// (ui/src/theme/tamaguiFonts.ts) the legacy engine resolved fontSize tokens against.
const fontSizeScales: Record<FontFamilyKey, Record<string, number>> = {
  heading: {
    small: fonts.heading3.fontSize,
    medium: fonts.heading2.fontSize,
    true: fonts.heading2.fontSize,
    large: fonts.heading1.fontSize,
  },
  subHeading: {
    small: fonts.subheading2.fontSize,
    large: fonts.subheading1.fontSize,
    true: fonts.subheading1.fontSize,
  },
  body: {
    nano: fonts.body5.fontSize,
    micro: fonts.body4.fontSize,
    small: fonts.body3.fontSize,
    medium: fonts.body2.fontSize,
    true: fonts.body2.fontSize,
    large: fonts.body1.fontSize,
  },
  button: {
    micro: fonts.buttonLabel4.fontSize,
    small: fonts.buttonLabel3.fontSize,
    medium: fonts.buttonLabel2.fontSize,
    large: fonts.buttonLabel1.fontSize,
    true: fonts.buttonLabel2.fontSize,
  },
  monospace: {
    micro: fonts.body4.fontSize,
    small: fonts.body3.fontSize,
    medium: fonts.body2.fontSize,
    large: fonts.body1.fontSize,
    true: fonts.body4.fontSize,
  },
}

function familyKeyOf(fontFamily: FontFamilyTokenValue | undefined): FontFamilyKey {
  if (fontFamily !== undefined && fontFamily.startsWith('$') && fontFamily.slice(1) in fontFamilyTokens) {
    return fontFamily.slice(1) as FontFamilyKey
  }
  return 'body'
}

/** `$small`/`$medium`/... resolved against the family in effect, as the legacy engine did. */
function resolveFontSize(
  value: number | string | undefined,
  fontFamily: FontFamilyTokenValue | undefined,
): number | string | undefined {
  if (typeof value !== 'string' || !value.startsWith('$')) {
    return value
  }
  return fontSizeScales[familyKeyOf(fontFamily)][value.slice(1)]
}

/** `$book`/`$medium`/`$true` → the repo's platform-adjusted weights (fonts.defaultWeights). */
function resolveFontWeight(
  value: TextStyle['fontWeight'] | string | undefined,
  fontFamily: FontFamilyTokenValue | undefined,
): TextStyle['fontWeight'] | string | undefined {
  if (typeof value !== 'string' || !value.startsWith('$')) {
    return value
  }
  const key = value.slice(1)
  if (key === 'true' && familyKeyOf(fontFamily) === 'button') {
    return BUTTON_MEDIUM_WEIGHT
  }
  return defaultWeights[key as keyof typeof defaultWeights]
}

// ---------------------------------------------------------------------------
// Legacy cascade transcription, captured from the legacy Tamagui Input rendered live
// (size '$true', unstyled=false): font body medium (16px / weight $medium / lineHeight
// 22px on web), height var(--t-size-true) = 8px, radius.true (0), padding-x
// var(--t-space-padding8) = 8px, borderWidth 1 with border/outline theme keys that all
// resolve to transparent (as do their focus/hover variants — so the legacy :focus /
// :hover / :focus-visible rules were invisible no-ops), backgroundColor $background
// (== $surface1 in both themes), color $color (== $neutral1), minWidth 0, outlineWidth 0.
// ---------------------------------------------------------------------------

const DEFAULT_HEIGHT = spacing.spacing8 // tokens.size.true — the legacy frame height really was 8px
const DEFAULT_PADDING_HORIZONTAL = spacing.spacing8 // tokens.space.padding8

export function defaultFrame(colors: UseSporeColorsReturn): InputStyleProps {
  return {
    fontFamily: fontFamilyTokens.body,
    fontSize: fonts.body2.fontSize,
    fontWeight: defaultWeights.medium,
    height: DEFAULT_HEIGHT,
    borderRadius: 0,
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: colors.surface1.val,
    color: colors.neutral1.val,
    minWidth: 0,
    outlineWidth: 0,
    outlineStyle: 'solid',
    outlineColor: 'transparent',
    // lineHeight intentionally omitted on native — Tamagui's input size variant deletes it there.
    ...(isWebPlatform ? { lineHeight: fonts.body2.lineHeight } : {}),
  }
}

export function resolveColor(colors: UseSporeColorsReturn, value: ColorTokenValue | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }
  // Tamagui styled(Input) wrappers deliver theme colors as `var(--<themeKey>)` references —
  // resolve them like `$<themeKey>` so the DOM gets a concrete, theme-correct value.
  const themeVarKey = /^var\(--([A-Za-z0-9]+)\)$/.exec(value)?.[1]
  const lookupKey = themeVarKey ?? (value.startsWith('$') ? value.slice(1) : undefined)
  if (lookupKey === undefined) {
    return value
  }
  const token = (colors as Record<string, UseSporeColorsReturn[keyof UseSporeColorsReturn] | undefined>)[lookupKey]
  return token === undefined ? value : String(token.val)
}

function applyAlpha(color: string, opacity: number | undefined): string {
  if (opacity === undefined || opacity >= 1) {
    return color
  }
  const hex = /^#([0-9a-fA-F]{6})$/.exec(color)
  if (hex?.[1] !== undefined) {
    const n = Number.parseInt(hex[1], 16)
    // oxlint-disable-next-line no-bitwise -- hex channel unpacking
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacity})`
  }
  const rgba = /^rgba?\(([^)]+)\)$/.exec(color)
  if (rgba?.[1] !== undefined) {
    const parts = rgba[1].split(',').map((p) => p.trim())
    const [r, g, b, a = '1'] = parts
    return `rgba(${r},${g},${b},${Number.parseFloat(a) * opacity})`
  }
  return color
}

/** RN shadow* props → box-shadow on web (the same conversion RNW applied), RN keys on native. */
function resolveShadowProps({
  colors,
  resolved,
  styleProps,
}: {
  colors: UseSporeColorsReturn
  resolved: Record<string, unknown>
  styleProps: InputStyleProps
}): void {
  const { shadowColor, shadowOffset, shadowOpacity, shadowRadius } = styleProps
  if (
    shadowColor === undefined &&
    shadowOffset === undefined &&
    shadowOpacity === undefined &&
    shadowRadius === undefined
  ) {
    return
  }
  const color = resolveColor(colors, shadowColor) ?? 'rgba(0,0,0,1)'
  if (isWebPlatform) {
    resolved['boxShadow'] =
      `${shadowOffset?.width ?? 0}px ${shadowOffset?.height ?? 0}px ${shadowRadius ?? 0}px ${applyAlpha(color, shadowOpacity)}`
    return
  }
  if (shadowColor !== undefined) {
    resolved['shadowColor'] = color
  }
  if (shadowOffset !== undefined) {
    resolved['shadowOffset'] = shadowOffset
  }
  if (shadowOpacity !== undefined) {
    resolved['shadowOpacity'] = shadowOpacity
  }
  if (shadowRadius !== undefined) {
    resolved['shadowRadius'] = shadowRadius
  }
}

type Edge = 'Top' | 'Bottom' | 'Left' | 'Right'

// Both shorthand families ('m'/'margin'/'mx'/…, 'p'/'padding'/'px'/…) expanded to their edges,
// plus RN's paddingEnd. Suffix → edges: '' all four, x/y the axis, l/r/t/b one edge.
const EDGE_SHORTHANDS: Record<string, { property: 'margin' | 'padding'; edges: readonly Edge[] }> = {}
for (const property of ['margin', 'padding'] as const) {
  const suffixEdges: ReadonlyArray<[string, string, readonly Edge[]]> = [
    ['', '', ['Top', 'Bottom', 'Left', 'Right']],
    ['x', 'Horizontal', ['Left', 'Right']],
    ['y', 'Vertical', ['Top', 'Bottom']],
    ['l', 'Left', ['Left']],
    ['r', 'Right', ['Right']],
    ['t', 'Top', ['Top']],
    ['b', 'Bottom', ['Bottom']],
  ]
  for (const [short, long, edges] of suffixEdges) {
    EDGE_SHORTHANDS[`${property[0]}${short}`] = { property, edges }
    EDGE_SHORTHANDS[`${property}${long}`] = { property, edges }
  }
}
EDGE_SHORTHANDS['paddingEnd'] = { property: 'padding', edges: ['Right'] }

/**
 * Expand the legacy margin/padding shorthand families into the four concrete edges, in the
 * bag's own key order — the legacy engine let a later prop override an earlier one regardless
 * of specificity (`<Input py="$spacing12" {...rest} />` with `p="$none"` in rest ends up with
 * zero padding), so `py` must not categorically beat `p`.
 * Caveat: spread keeps a key's FIRST position when a later bag overwrites its value, so a
 * caller shorthand colliding with the same wrapper-default key can lose to a later sibling.
 */
function resolveEdgeShorthands(resolved: Record<string, unknown>, styleProps: InputStyleProps): void {
  const bag = styleProps as Record<string, unknown>
  for (const key of Object.keys(bag)) {
    const shorthand = EDGE_SHORTHANDS[key]
    const value = bag[key] as SpaceTokenValue | 'auto' | null | undefined
    if (shorthand === undefined || value === undefined) {
      continue
    }
    for (const edge of shorthand.edges) {
      resolved[`${shorthand.property}${edge}`] = resolveSpace(value)
    }
  }
}

/**
 * Re-inserts edge-shorthand keys in ascending specificity (all → axis → longhand) so the
 * order-driven expansion above yields RN's within-one-style-object semantics, where a longhand
 * beats an overlapping shorthand regardless of key order ({ paddingLeft: 0, paddingHorizontal: 12 }
 * keeps paddingLeft 0). For RN `style` objects only — JSX props resolve by authored order.
 */
function withRNEdgePrecedence(styleProps: InputStyleProps): InputStyleProps {
  const bag = styleProps as Record<string, unknown>
  const keys = Object.keys(bag)
  // Stable sort: non-edge keys rank equal and keep their order; longhands land last so they win.
  keys.sort((a, b) => (EDGE_SHORTHANDS[b]?.edges.length ?? 0) - (EDGE_SHORTHANDS[a]?.edges.length ?? 0))
  const out: Record<string, unknown> = {}
  for (const key of keys) {
    out[key] = bag[key]
  }
  return out as InputStyleProps
}

/**
 * Typography: family/size/weight tokens (unknown tokens fall back to the frame defaults
 * instead of erasing them — an undefined token also crashes Android TextInput), px numeric
 * lineHeight on web, and the RN verticalAlign 'center' → 'middle' mapping on native.
 */
function resolveTypographyProps(resolved: Record<string, unknown>, styleProps: InputStyleProps): void {
  const { fontFamily, fontSize, fontWeight, lineHeight, verticalAlign } = styleProps
  if (fontFamily !== undefined) {
    resolved['fontFamily'] = resolveFontFamily(fontFamily)
  }
  const resolvedFontSize = resolveFontSize(fontSize, fontFamily)
  if (resolvedFontSize !== undefined) {
    resolved['fontSize'] = resolvedFontSize
  }
  const resolvedFontWeight = resolveFontWeight(fontWeight, fontFamily)
  if (resolvedFontWeight !== undefined) {
    resolved['fontWeight'] = resolvedFontWeight
  }
  if (lineHeight !== undefined) {
    if (typeof lineHeight === 'number') {
      // React leaves numeric line-height unitless (a multiplier); the legacy cascade emitted px.
      resolved['lineHeight'] = isWebPlatform ? `${lineHeight}px` : lineHeight
    } else if (isWebPlatform) {
      // Percent-string lineHeights are web-only CSS; native TextStyle requires a number.
      resolved['lineHeight'] = lineHeight
    }
  }
  if (verticalAlign !== undefined) {
    resolved['verticalAlign'] = !isWebPlatform && verticalAlign === 'center' ? 'middle' : verticalAlign
  }
}

/**
 * Resolve one InputStyleProps bag (base frame, user props, focus/hover overrides, breakpoint
 * overrides) into a flat style object with tokens replaced by concrete values, spacing
 * shorthands expanded, and web-only keys dropped on native.
 */
export function resolveStyleProps(colors: UseSporeColorsReturn, styleProps: InputStyleProps): Record<string, unknown> {
  const {
    backgroundColor,
    color,
    borderColor,
    outlineColor,
    borderWidth,
    borderRadius,
    height,
    width,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    verticalAlign: _verticalAlign,
    shadowColor: _shadowColor,
    shadowOffset: _shadowOffset,
    shadowOpacity: _shadowOpacity,
    shadowRadius: _shadowRadius,
    m: _m,
    mx: _mx,
    my: _my,
    ml: _ml,
    mr: _mr,
    mt: _mt,
    mb: _mb,
    margin: _margin,
    marginLeft: _marginLeft,
    marginRight: _marginRight,
    marginTop: _marginTop,
    marginBottom: _marginBottom,
    marginVertical: _marginVertical,
    marginHorizontal: _marginHorizontal,
    p: _p,
    px: _px,
    py: _py,
    pl: _pl,
    pr: _pr,
    pt: _pt,
    pb: _pb,
    padding: _padding,
    paddingLeft: _paddingLeft,
    paddingRight: _paddingRight,
    paddingEnd: _paddingEnd,
    paddingTop: _paddingTop,
    paddingBottom: _paddingBottom,
    paddingVertical: _paddingVertical,
    paddingHorizontal: _paddingHorizontal,
    fontFamily: _fontFamily,
    fontSize: _fontSize,
    fontWeight: _fontWeight,
    lineHeight: _lineHeight,
    ...rest
  } = styleProps

  const resolved: Record<string, unknown> = { ...rest }

  const colorEntries: Array<[string, ColorTokenValue | undefined]> = [
    ['backgroundColor', backgroundColor],
    ['color', color],
    ['borderColor', borderColor],
    ['outlineColor', outlineColor],
  ]
  for (const [key, colorValue] of colorEntries) {
    if (colorValue !== undefined) {
      resolved[key] = resolveColor(colors, colorValue)
    }
  }
  const spaceEntries: Array<[string, InputStyleProps['height']]> = [
    ['borderWidth', borderWidth],
    ['height', height],
    ['width', width],
    ['minWidth', minWidth],
    ['maxWidth', maxWidth],
    ['minHeight', minHeight],
    ['maxHeight', maxHeight],
  ]
  for (const [key, spaceValue] of spaceEntries) {
    if (spaceValue !== undefined) {
      resolved[key] = resolveSpace(spaceValue)
    }
  }
  if (borderRadius !== undefined) {
    resolved['borderRadius'] = resolveRadius(borderRadius)
  }
  resolveTypographyProps(resolved, styleProps)

  resolveShadowProps({ colors, resolved, styleProps })
  resolveEdgeShorthands(resolved, styleProps)

  if (!isWebPlatform) {
    for (const key of WEB_ONLY_STYLE_KEYS) {
      delete resolved[key]
    }
  }

  return resolved
}

// Tamagui styled(Input, ...) wrappers deliver their resolved spacing as `var(--t-space-<token>)`
// strings. The web leg renders a real DOM element, so var() works natively there; on native,
// resolve them back to token pixels at this boundary. Remove when the last styled(Input) call
// site is off Tamagui.
export function resolveTamaguiSpaceVars(
  colors: UseSporeColorsReturn,
  style: StyleProp<TextStyle> | undefined,
): Record<string, unknown> | undefined {
  if (style === null || style === undefined) {
    return undefined
  }
  const flat = StyleSheet.flatten(style) as Record<string, unknown>
  // RN shorthands in a style object (paddingHorizontal, m/mx, shadow*) are invalid CSS on
  // web, where RNW expanded them — run the style-prop keys through the shared resolvers and
  // pass everything else through untouched (var() strings survive both paths).
  // RN resolves overlapping edge keys within one style object by specificity, not key order.
  const resolved: Record<string, unknown> = {
    ...omitStyleProps(flat),
    ...resolveStyleProps(colors, withRNEdgePrecedence(pickStyleProps(flat))),
  }
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value !== 'string') {
      continue
    }
    // Tamagui styled(Input) wrappers deliver THEME tokens as `var(--<themeKey>)` references
    // (backgroundColor: 'var(--surface2)', borderTopColor: 'var(--surface3)', …). Resolve
    // them to the live theme value: deterministic in any DOM (jsdom's cssstyle silently
    // drops var() on validated color properties), theme-aware via useSporeColors, and
    // independent of Tamagui's injected CSS variables surviving the migration.
    const themeMatch = /^var\(--([A-Za-z0-9]+)\)$/.exec(value)
    const themeKey = themeMatch?.[1]
    if (themeKey !== undefined) {
      const token = (colors as Record<string, { val: unknown } | undefined>)[themeKey]
      if (token !== undefined) {
        resolved[key] = String(token.val)
      }
      continue
    }
    if (!isWebPlatform) {
      const match = /^var\(--t-space-([A-Za-z0-9]+)\)$/.exec(value)
      const token = match?.[1]
      if (token !== undefined && token in spacingTokens) {
        resolved[key] = spacingTokens[token as keyof typeof spacingTokens]
      }
    }
  }
  return resolved
}
