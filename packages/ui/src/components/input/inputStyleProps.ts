/**
 * The style-prop surface of the Tamagui-free Input rebuild (INFRA-3318): the token value
 * types, the InputStyleProps shape the legacy Tamagui Input accepted at our call sites, and
 * the pick/omit helpers that split style props from the passthrough prop bag. Resolution to
 * concrete values lives in ./inputStyleResolution.ts.
 */
import { type UseSporeColorsReturn } from '@universe/mycelium/theme-hooks-compat'
import type { CSSProperties } from 'react'
import type { DimensionValue, TextStyle } from 'react-native'
import { baselBook, baselMedium, borderRadii, gap, monospaceFontFamily, padding, spacing } from 'ui/src/theme'

export const spacingTokens = { ...spacing, ...padding, ...gap }

// The same `$fontFamily` token → font stack map the Tamagui config assembled (ui/src/theme/tamaguiFonts.ts),
// kept Tamagui-free here.
export const fontFamilyTokens = {
  heading: baselBook,
  subHeading: baselBook,
  body: baselBook,
  button: baselMedium,
  monospace: monospaceFontFamily,
}

export type SpaceTokenValue = `$${keyof typeof spacingTokens}` | number
export type RadiusTokenValue = `$${keyof typeof borderRadii}` | number
// Token-first, but every legacy call site could also pass a raw color string (e.g. 'rgba(...)').
export type ColorTokenValue = `$${string & keyof UseSporeColorsReturn}` | (string & {})
export type FontFamilyTokenValue = `$${keyof typeof fontFamilyTokens}` | (string & {})

/**
 * Style surface the legacy Tamagui Input accepted at our call sites, token-valued where the
 * old styled() props were. Also the shape of focusStyle / hoverStyle / groupHoverStyle overrides.
 */
export type InputStyleProps = {
  backgroundColor?: ColorTokenValue
  color?: ColorTokenValue
  borderColor?: ColorTokenValue
  outlineColor?: ColorTokenValue
  borderWidth?: SpaceTokenValue
  borderStyle?: 'solid' | 'dotted' | 'dashed'
  borderRadius?: RadiusTokenValue
  // (string & {}) matches the legacy Tamagui-typed call sites ('100%', 'max-content', theme keys)
  height?: SpaceTokenValue | DimensionValue | (string & {})
  width?: SpaceTokenValue | DimensionValue | (string & {})
  minWidth?: SpaceTokenValue | DimensionValue | (string & {})
  maxWidth?: SpaceTokenValue | DimensionValue | (string & {})
  minHeight?: SpaceTokenValue | DimensionValue | (string & {})
  maxHeight?: SpaceTokenValue | DimensionValue | (string & {})
  flex?: number
  flexGrow?: number
  flexShrink?: number
  flexBasis?: DimensionValue
  alignItems?: 'center' | 'flex-start' | 'flex-end' | 'stretch'
  alignSelf?: 'auto' | 'center' | 'flex-start' | 'flex-end' | 'stretch' | (string & {})
  position?: 'absolute' | 'relative'
  top?: DimensionValue
  bottom?: DimensionValue
  left?: DimensionValue
  right?: DimensionValue
  zIndex?: number
  opacity?: number
  shadowColor?: ColorTokenValue
  shadowOffset?: { width: number; height: number }
  shadowOpacity?: number
  shadowRadius?: number
  m?: SpaceTokenValue | 'auto'
  mx?: SpaceTokenValue | 'auto'
  my?: SpaceTokenValue
  ml?: SpaceTokenValue | 'auto'
  mr?: SpaceTokenValue | 'auto'
  mt?: SpaceTokenValue
  mb?: SpaceTokenValue
  margin?: SpaceTokenValue | 'auto'
  marginLeft?: SpaceTokenValue | 'auto'
  marginRight?: SpaceTokenValue | 'auto'
  marginTop?: SpaceTokenValue
  marginBottom?: SpaceTokenValue
  marginVertical?: SpaceTokenValue
  marginHorizontal?: SpaceTokenValue | 'auto'
  p?: SpaceTokenValue
  px?: SpaceTokenValue
  py?: SpaceTokenValue
  pl?: SpaceTokenValue
  pr?: SpaceTokenValue
  pt?: SpaceTokenValue
  pb?: SpaceTokenValue
  padding?: SpaceTokenValue
  paddingLeft?: SpaceTokenValue
  paddingRight?: SpaceTokenValue
  paddingEnd?: SpaceTokenValue
  paddingTop?: SpaceTokenValue
  paddingBottom?: SpaceTokenValue
  paddingVertical?: SpaceTokenValue
  paddingHorizontal?: SpaceTokenValue
  fontSize?: number | string
  fontWeight?: TextStyle['fontWeight'] | string
  fontFamily?: FontFamilyTokenValue
  lineHeight?: number | string
  letterSpacing?: number | string
  textAlign?: 'left' | 'center' | 'right'
  // Legacy Tamagui accepted 'center' (CSS); mapped to RN's 'middle' on native.
  verticalAlign?: 'auto' | 'top' | 'bottom' | 'middle' | 'center'
  // Web-only CSS the legacy engine forwarded; silently ignored on native (matching Tamagui).
  outlineWidth?: number
  outlineStyle?: string
  textOverflow?: CSSProperties['textOverflow']
  whiteSpace?: CSSProperties['whiteSpace']
  overflow?: CSSProperties['overflow']
  visibility?: CSSProperties['visibility']
  cursor?: CSSProperties['cursor']
  scrollbarWidth?: CSSProperties['scrollbarWidth']
}

export const STYLE_PROP_KEYS = [
  'backgroundColor',
  'color',
  'borderColor',
  'outlineColor',
  'borderWidth',
  'borderStyle',
  'borderRadius',
  'height',
  'width',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignItems',
  'position',
  'top',
  'bottom',
  'left',
  'right',
  'zIndex',
  'opacity',
  'shadowColor',
  'shadowOffset',
  'shadowOpacity',
  'shadowRadius',
  'm',
  'mx',
  'my',
  'ml',
  'mr',
  'mt',
  'mb',
  'margin',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'marginVertical',
  'marginHorizontal',
  'p',
  'px',
  'py',
  'pl',
  'pr',
  'pt',
  'pb',
  'padding',
  'paddingLeft',
  'paddingRight',
  'paddingEnd',
  'paddingTop',
  'paddingBottom',
  'paddingVertical',
  'paddingHorizontal',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'verticalAlign',
  'alignSelf',
  'scrollbarWidth',
  'outlineWidth',
  'outlineStyle',
  'textOverflow',
  'whiteSpace',
  'overflow',
  'visibility',
  'cursor',
] as const satisfies ReadonlyArray<keyof InputStyleProps>

// Compile-time drift guard: every InputStyleProps key must appear in STYLE_PROP_KEYS,
// otherwise a prop that typechecks would silently never be picked up.
type MissingStylePropKeys = Exclude<keyof InputStyleProps, (typeof STYLE_PROP_KEYS)[number]>
type AssertAllStylePropsListed = MissingStylePropKeys extends never ? true : ['missing keys:', MissingStylePropKeys]
const _stylePropKeysCoverInputStyleProps: AssertAllStylePropsListed = true

// overflow is deliberately NOT here — React Native styles support it and the legacy engine applied it.
export const WEB_ONLY_STYLE_KEYS: ReadonlySet<string> = new Set([
  'outlineWidth',
  'outlineStyle',
  'outlineColor',
  'textOverflow',
  'whiteSpace',
  'visibility',
  'cursor',
  'scrollbarWidth',
])

const STYLE_PROP_KEY_SET: ReadonlySet<string> = new Set(STYLE_PROP_KEYS)

/**
 * A copy of the props bag without style-surface keys or Tamagui-convention `$`-prefixed
 * props — they were already resolved into the style object and must not reach the platform
 * element (DOM attribute / native TextInput prop) as unknowns. Pure, like pickStyleProps.
 */
export function omitStyleProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(props)) {
    if (!STYLE_PROP_KEY_SET.has(key) && !key.startsWith('$')) {
      out[key] = props[key]
    }
  }
  return out
}

/**
 * Iterates the source bag's own key order (not STYLE_PROP_KEYS) so JSX prop order survives —
 * the legacy engine resolved overlapping shorthands (`py` then `p`) by that order.
 */
export function pickStyleProps(props: Record<string, unknown>): InputStyleProps {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(props)) {
    if (STYLE_PROP_KEY_SET.has(key) && props[key] !== undefined) {
      out[key] = props[key]
    }
  }
  return out as InputStyleProps
}
