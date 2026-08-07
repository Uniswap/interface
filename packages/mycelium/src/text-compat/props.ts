/**
 * The Tamagui-compatible Text prop contract, built on the shared compat
 * surfaces (`../compat/props`): `TextCompatProps = CompatProps<S> + Text
 * extras`, where `S` is the Text style surface — typography + truncation +
 * flexbox layered over the universal `CompatStyleProps` — plus the
 * Text-specific pass-through (title, loading shimmer, RN Text inert props).
 */
import type { CompatProps, CompatPseudoProps, CompatStyleProps, SizeValue, SpaceValue } from '../compat/props'
import type { LongTailStyleProp } from './style-props'
import type { SporeColorToken, TextVariant } from './tokens'

export type { TextVariant }
export type {
  GroupState,
  GroupStatePropKey,
  InsetShorthand,
  MediaPropKey,
  SizeValue,
  SpaceValue,
  TransformEntry,
} from '../compat/props'

/** Spore theme color token ($neutral1 / neutral1) or any raw CSS color. */
export type ColorValue = SporeColorToken | (string & {})

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse' | 'unset'
export type AlignItems = 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'unset'
export type AlignSelf = 'auto' | AlignItems
export type JustifyContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'unset'
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse' | 'unset'
export type DisplayValue =
  | 'inherit'
  | 'none'
  | 'inline'
  | 'block'
  | 'contents'
  | 'flex'
  | 'inline-flex'
  | 'inline-block'
  | 'unset'

export type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify' | 'start' | 'end' | 'unset'
export type TextTransform = 'none' | 'capitalize' | 'uppercase' | 'lowercase' | 'unset'
export type TextDecorationLine = 'none' | 'underline' | 'line-through' | 'underline line-through' | 'unset'
export type FontStyle = 'normal' | 'italic' | 'unset'
export type WhiteSpace = 'normal' | 'nowrap' | 'pre' | 'pre-line' | 'pre-wrap' | 'break-spaces' | 'unset'
export type WordWrap = 'normal' | 'break-word' | 'anywhere' | 'unset'
export type UserSelect = 'auto' | 'text' | 'none' | 'contain' | 'all' | 'unset'

/** Tamagui font tokens; fontSize/lineHeight tokens resolve against the active font. */
export type FontFamilyToken = '$heading' | '$subHeading' | '$body' | '$button' | '$monospace'
/** Font-relative size/lineHeight token, Text-variant-named token, raw number (px), or CSS string. */
export type FontSizeValue = `$${string}` | number | string
export type FontWeightValue = '$book' | '$medium' | '$true' | number | (string & {})
export type LineHeightValue = `$${string}` | number | 'unset' | (string & {})

/** The Text-specific curated surface: typography, truncation, and flexbox. */
export interface TextStyleProps {
  // typography
  /** Typography variant — valid inside media/pseudo pools too, like Tamagui. */
  variant?: TextVariant
  color?: ColorValue
  fontFamily?: FontFamilyToken | (string & {})
  fontSize?: FontSizeValue
  fontWeight?: FontWeightValue
  fontStyle?: FontStyle
  letterSpacing?: number | string
  /** `'unset'` skips the variant line-height (Vietnamese diacritics support). */
  lineHeight?: LineHeightValue
  textAlign?: TextAlign
  textTransform?: TextTransform
  textDecorationLine?: TextDecorationLine
  textDecorationColor?: ColorValue
  whiteSpace?: WhiteSpace
  wordWrap?: WordWrap
  textOverflow?: 'clip' | 'ellipsis' | 'unset'
  userSelect?: UserSelect
  cursor?: string
  textShadowColor?: ColorValue
  textShadowOffset?: { width: number; height: number }
  textShadowRadius?: number

  // Tamagui Text variants
  /** 1 = single-line ellipsis; >1 = -webkit-line-clamp, exactly like Tamagui. */
  numberOfLines?: number
  /** user-select + cursor text/default pair (Tamagui `selectable` variant). */
  selectable?: boolean
  /** @deprecated Tamagui: use `ellipsis`. Single-line ellipsis. */
  ellipse?: boolean
  ellipsis?: boolean

  // flexbox
  flexDirection?: FlexDirection
  alignItems?: AlignItems
  alignSelf?: AlignSelf
  justifyContent?: JustifyContent
  flexWrap?: FlexWrap
  flex?: number
  flexBasis?: SizeValue
  flexGrow?: number
  flexShrink?: number
  display?: DisplayValue
  gap?: SpaceValue
  rowGap?: SpaceValue
  columnGap?: SpaceValue
}

/** Generic long-tail props — compiled to arbitrary-property utilities. */
export type LongTailStyleProps = {
  [K in LongTailStyleProp]?: string | number
}

/**
 * The full Text style-object surface: typography/truncation/flexbox + the
 * universal styles (margin/padding, sizing, visuals, positioning, transforms,
 * shadows — inherited through `CompatProps`) + the long tail.
 */
export type TextCompatStyleProps = CompatStyleProps &
  TextStyleProps &
  Omit<LongTailStyleProps, keyof (CompatStyleProps & TextStyleProps)>

/** Pseudo-state style objects keyed to the Text style surface. */
export type TextCompatPseudoProps = CompatPseudoProps<TextCompatStyleProps>

/** Text-only pass-through: shimmer contract + RN Text inert props. */
export interface TextCompatExtraProps {
  /**
   * Loading state: renders the shimmer placeholder sized by
   * `loadingPlaceholderText` instead of children. `'no-shimmer'` keeps the
   * placeholder without the shine animation.
   */
  loading?: boolean | 'no-shimmer'
  /** Text the loader's size derives from (default `'000.00'`). */
  loadingPlaceholderText?: string
  onTextLayout?(this: void, event: unknown): void
  /** Native-only font auto-scaling; the web Text ignores it (useEnableFontScaling web stub). */
  allowFontScaling?: boolean
  /** Native-only companion to allowFontScaling. */
  maxFontSizeMultiplier?: number
  /** Native truncation position; web ellipsis is always tail (CSS limitation, matches RNW). */
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip'
  adjustsFontSizeToFit?: boolean
  minimumFontScale?: number
  suppressHighlighting?: boolean
}

/** The full Text prop contract: Text styles + every shared compat surface + Text extras. */
export type TextCompatProps = CompatProps<TextCompatStyleProps> & TextCompatExtraProps
