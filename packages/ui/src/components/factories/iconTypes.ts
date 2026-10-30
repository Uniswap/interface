/**
 * Public prop-shape types for the Tamagui-free icon factory (INFRA-3314): the re-derived style
 * overlay, media and group-pseudo blocks that make up `IconProps`. Split from iconTokens.ts to
 * keep both files within lint size limits.
 */
import { type DynamicColor } from '@universe/mycelium/theme-hooks-compat'
import type { OpaqueColorValue } from 'react-native'
import type { IconColorToken, IconSpaceValue } from 'ui/src/components/factories/iconTokens'
import type { IconSizeTokens } from 'ui/src/theme/tokens'

export type IconColorValue = IconColorToken | (string & {})

// Icons also accept native PlatformColor / DynamicColorIOS values; mycelium's DynamicColor is string-only.
export type IconDynamicColor = DynamicColor | OpaqueColorValue

export type IconDimensionValue = number | (string & {})

/**
 * The Tamagui-free re-derivation (INFRA-3314) of the style-prop overlay the old
 * `@tamagui/helpers-icon` `IconProps` carried (StackStyleBase + shorthands + pseudos + media).
 * Restated to the props icon call sites actually use, with `(string & {})` keeping the web-only
 * string values (`'auto'`, `'16px'`, `'100%'`) compiling exactly as they did under
 * `allowedStyleValues: 'somewhat-strict-web'`.
 */
export interface IconStyleOverlay {
  alignContent?: string
  alignItems?: string
  alignSelf?: string
  aspectRatio?: number | string
  backgroundColor?: IconColorValue
  borderBottomColor?: IconColorValue
  borderColor?: IconColorValue
  borderLeftColor?: IconColorValue
  borderRightColor?: IconColorValue
  borderTopColor?: IconColorValue
  borderBottomLeftRadius?: IconDimensionValue
  borderBottomRightRadius?: IconDimensionValue
  borderRadius?: IconDimensionValue
  borderTopLeftRadius?: IconDimensionValue
  borderTopRightRadius?: IconDimensionValue
  borderStyle?: 'solid' | 'dotted' | 'dashed' | (string & {})
  borderBottomWidth?: IconDimensionValue
  borderLeftWidth?: IconDimensionValue
  borderRightWidth?: IconDimensionValue
  borderTopWidth?: IconDimensionValue
  borderWidth?: IconDimensionValue
  bottom?: IconSpaceValue
  boxShadow?: string
  columnGap?: IconSpaceValue
  cursor?: string | number
  direction?: 'inherit' | 'ltr' | 'rtl' | (string & {}) | number
  display?: string | number
  filter?: string | number
  flex?: number
  flexBasis?: IconDimensionValue
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  flexGrow?: number
  flexShrink?: number
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
  gap?: IconSpaceValue
  inset?: IconSpaceValue
  justifyContent?: string
  left?: IconSpaceValue
  margin?: IconSpaceValue
  marginBottom?: IconSpaceValue
  marginEnd?: IconSpaceValue
  marginHorizontal?: IconSpaceValue
  marginLeft?: IconSpaceValue
  marginRight?: IconSpaceValue
  marginStart?: IconSpaceValue
  marginTop?: IconSpaceValue
  marginVertical?: IconSpaceValue
  maxHeight?: IconDimensionValue
  maxWidth?: IconDimensionValue
  minHeight?: IconDimensionValue
  minWidth?: IconDimensionValue
  // number | numeric-string: the DOM SVG flavor allows strings (cross-system assignability)
  opacity?: number | (string & {})
  overflow?: 'visible' | 'hidden' | 'scroll' | (string & {}) | number
  padding?: IconSpaceValue
  paddingBottom?: IconSpaceValue
  paddingEnd?: IconSpaceValue
  paddingHorizontal?: IconSpaceValue
  paddingLeft?: IconSpaceValue
  paddingRight?: IconSpaceValue
  paddingStart?: IconSpaceValue
  paddingTop?: IconSpaceValue
  paddingVertical?: IconSpaceValue
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only' | (string & {}) | number
  position?: 'absolute' | 'relative' | (string & {})
  right?: IconSpaceValue
  rotate?: number | (string & {})
  rotateX?: string
  rotateY?: string
  rotateZ?: string
  rowGap?: IconSpaceValue
  scale?: number | (string & {})
  scaleX?: number
  scaleY?: number
  top?: IconSpaceValue
  transform?: string
  transformOrigin?: string | number
  transition?: string
  userSelect?: string
  // typed but deliberately inert: Tamagui's Stack never compiled verticalAlign (it is a text-only
  // style there), so the old pipeline passed it through as a dead SVG attribute — preserved as-is.
  // Widened to the DOM union (csstype allows numeric lengths) so ui icons stay assignable to
  // mycelium GeneratedIcon slots after INFRA-3320 widened that surface — see ui-icon-assignability pin
  verticalAlign?: string | number
  x?: number | string
  y?: number | string
  zIndex?: IconDimensionValue
  // shorthands (mirror of ui/src/theme/shorthands.ts)
  m?: IconSpaceValue
  mb?: IconSpaceValue
  ml?: IconSpaceValue
  mr?: IconSpaceValue
  mt?: IconSpaceValue
  mx?: IconSpaceValue
  my?: IconSpaceValue
  p?: IconSpaceValue
  pb?: IconSpaceValue
  pl?: IconSpaceValue
  pr?: IconSpaceValue
  pt?: IconSpaceValue
  px?: IconSpaceValue
  py?: IconSpaceValue
}

/** Styles a media/group/pseudo block may carry; `size` resolves through the icon size table like the base prop. */
export type IconOverrideStyle = IconStyleOverlay & {
  // object form included so ui icons stay assignable to mycelium GeneratedIcon slots (INFRA-3320
  // pools carry it); resolveSizePx already honors it, same as the base `size` prop
  size?: IconSizeTokens | number | { width: number; height: number }
  color?: IconColorValue | IconDynamicColor | null
  width?: IconDimensionValue
  height?: IconDimensionValue
}

export type IconMediaProps = {
  [key in
    | '$xxs'
    | '$xs'
    | '$sm'
    | '$md'
    | '$lg'
    | '$xl'
    | '$xxl'
    | '$xxxl'
    | '$short'
    | '$midHeight'
    | '$lgHeight']?: IconOverrideStyle
}

export type IconGroupPseudoProps = {
  [key in
    | '$group-hover'
    | '$group-press'
    | '$group-focus'
    | '$group-item-hover'
    | '$group-item-press'
    | '$group-item-focus'
    | '$group-card-hover'
    | '$group-card-press'
    | '$group-card-focus']?: IconOverrideStyle
}
