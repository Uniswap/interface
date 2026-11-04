/**
 * The `Input` compat prop contract (INFRA-3600): the closed style surface the
 * legacy Input accepted, so converted call sites keep typechecking.
 *
 * Token-shaped props stay token-shaped (`"$spacing8"`, `"$rounded12"`,
 * `"$surface1"`) — narrowing a token prop to a scalar is the INFRA-3232
 * regression class. Values resolve at render, not compile: this surface rides
 * inline styles (a stateful form control whose cascade legacy Tamagui also
 * resolved at runtime), so uniwind's static class scan is not in play.
 */
import type { CSSProperties } from 'react'
import type { DimensionValue, StyleProp, TextInputProps as RNTextInputProps, TextStyle } from 'react-native'
import type { ThemeColorName } from '../theme-hooks-compat/tokens'
import { borderRadii, spacing } from '../tokens'
import type { fontFamilyTokens } from './font-tokens'

/**
 * ui/src/theme/spacing.ts `padding`/`gap` families, derived from the shared
 * spacing values (never copied literals) exactly like the legacy module.
 */
export const paddingTokens = {
  padding6: spacing.spacing6,
  padding8: spacing.spacing8,
  padding12: spacing.spacing12,
  padding16: spacing.spacing16,
  padding20: spacing.spacing20,
  padding24: spacing.spacing24,
  padding36: spacing.spacing36,
}

export const gapTokens = {
  gap2: spacing.spacing2,
  gap4: spacing.spacing4,
  gap8: spacing.spacing8,
  gap12: spacing.spacing12,
  gap16: spacing.spacing16,
  gap20: spacing.spacing20,
  gap24: spacing.spacing24,
  gap32: spacing.spacing32,
  gap36: spacing.spacing36,
}

export const spacingTokens = { ...spacing, ...paddingTokens, ...gapTokens }

export { borderRadii }

export type SpaceTokenValue = `$${keyof typeof spacingTokens}` | number
export type RadiusTokenValue = `$${keyof typeof borderRadii}` | number
// Token-first, but every legacy call site could also pass a raw color string (e.g. 'rgba(...)').
export type ColorTokenValue = `$${ThemeColorName}` | (string & {})
export type FontFamilyTokenValue = `$${keyof typeof fontFamilyTokens}` | (string & {})

/**
 * Style surface the legacy Input accepted at our call sites, token-valued where the
 * old styled() props were. Also the shape of focusStyle / hoverStyle / groupHoverStyle overrides.
 */
export type InputCompatStyleProps = {
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

export type BreakpointOverride = InputCompatStyleProps & { '$platform-web'?: CSSProperties }

export type InputCompatProps = Omit<
  RNTextInputProps,
  'style' | 'placeholderTextColor' | 'selectionColor' | 'verticalAlign'
> &
  InputCompatStyleProps & {
    placeholderTextColor?: ColorTokenValue
    selectionColor?: ColorTokenValue
    focusStyle?: InputCompatStyleProps
    hoverStyle?: InputCompatStyleProps
    focusVisibleStyle?: InputCompatStyleProps
    /** Applied when the nearest Tamagui `group` ancestor is hovered (web only, best-effort). */
    groupHoverStyle?: InputCompatStyleProps
    /** Web-only styles, matching the legacy `$platform-web` prop. */
    '$platform-web'?: CSSProperties
    /** Overrides at or below the `$sm` breakpoint (max-width 450px). */
    $sm?: BreakpointOverride
    /** Overrides at or below the `$md` breakpoint (max-width 640px). */
    $md?: BreakpointOverride
    /** Skip the legacy Input default frame, matching Tamagui's `unstyled` variant. */
    unstyled?: boolean
    disabled?: boolean
    'data-testid'?: string
    rows?: number
    style?: StyleProp<TextStyle>
  }

/**
 * The RN prop surface left after `useInputVisualState` consumes the style/interaction layer:
 * what each platform leg forwards to its underlying element.
 */
export type InputCompatForwardProps = Omit<
  RNTextInputProps,
  | 'style'
  | 'placeholderTextColor'
  | 'selectionColor'
  | 'verticalAlign'
  | 'onFocus'
  | 'onBlur'
  | 'testID'
  | 'editable'
  | keyof InputCompatStyleProps
> & { rows?: number }

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
] as const satisfies ReadonlyArray<keyof InputCompatStyleProps>

// Compile-time drift guard: every InputCompatStyleProps key must appear in STYLE_PROP_KEYS,
// otherwise a prop that typechecks would silently never be picked up.
type MissingStylePropKeys = Exclude<keyof InputCompatStyleProps, (typeof STYLE_PROP_KEYS)[number]>
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
 * Ported from the ui/src rebuild's CONS-3100 fix.
 */
export function pickStyleProps(props: Record<string, unknown>): InputCompatStyleProps {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(props)) {
    if (STYLE_PROP_KEY_SET.has(key) && props[key] !== undefined) {
      out[key] = props[key]
    }
  }
  return out as InputCompatStyleProps
}

/**
 * Shared focus/hover presets for `focusStyle={inputStyles.inputFocus}`-style
 * call sites (formerly ui's `inputStyles`).
 */
export const inputStyles = {
  noOutline: { outlineWidth: 0 },
  inputFocus: {
    backgroundColor: '$surface1',
    borderWidth: 1,
    borderColor: '$surface3',
    outlineWidth: 0,
  },
  inputHover: { borderWidth: 1, borderColor: '$surface3', outlineWidth: 0 },
} as const
