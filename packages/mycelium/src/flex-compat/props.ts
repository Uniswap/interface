/**
 * The Flex-specific prop contract: the flexbox layout style props, composed
 * with the shared compat surfaces (`CompatProps`) to form `FlexCompatProps`.
 * The universal style props (margin/padding, sizing, visuals, positioning,
 * transforms, shadows) and every non-layout surface live in `../compat/props`.
 *
 * The parity suite in `packages/tailwind/src/parity` asserts at the type level
 * that this contract covers `FlexProps` (`GetProps<typeof Flex>`) up to an
 * explicit exclusion list.
 */
import type {
  CompatProps,
  CompatPseudoProps,
  CompatStyleProps,
  DisplayValue,
  InsetShorthand,
  LongTailStyleProps,
  SizeValue,
  SpaceValue,
} from '../compat/props'

export type { GroupState, GroupStatePropKey, MediaPropKey } from '../compat/props'

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

/** Flexbox layout props: the Tamagui `Flex` variants + flexbox style props. */
export interface FlexLayoutStyleProps {
  // Tamagui Flex variants
  row?: boolean
  shrink?: boolean
  grow?: boolean
  fill?: boolean
  centered?: boolean
  inset?: SpaceValue | InsetShorthand
  maxContent?: boolean

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

/** The full Flex style-object surface: layout + universal styles + long tail. */
export type FlexCompatStyleProps = CompatStyleProps &
  FlexLayoutStyleProps &
  Omit<LongTailStyleProps, keyof (CompatStyleProps & FlexLayoutStyleProps)>

/** Pseudo-state style objects keyed to the Flex style surface. */
export type FlexCompatPseudoProps = CompatPseudoProps<FlexCompatStyleProps>

/** The full Flex prop contract: Flex styles + every shared compat surface. */
export type FlexCompatProps = CompatProps<FlexCompatStyleProps>
