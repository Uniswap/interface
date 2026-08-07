/**
 * The View-specific prop contract: the plain flexbox style-prop surface,
 * composed with the shared compat surfaces (`CompatProps`) to form
 * `ViewCompatProps`. Unlike `FlexLayoutStyleProps`, there are NO variant
 * shorthands (row/shrink/grow/fill/centered/maxContent) — those are
 * Flex styled-variants the plain Tamagui `View` never had. View is demoted
 * from the migration critical path (INFRA-2950); do not grow this surface.
 *
 * The parity block in `packages/tailwind/src/parity/view` asserts at the type
 * level that this contract covers Tamagui's `ViewProps` up to an explicit
 * exclusion list.
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
import type { AlignItems, AlignSelf, FlexDirection, FlexWrap, JustifyContent } from '../flex-compat/props'

export type { GroupState, GroupStatePropKey, MediaPropKey } from '../compat/props'

/** Flexbox layout style props — the plain `View` surface, no Flex variants. */
export interface ViewLayoutStyleProps {
  /** Tamagui style prop, emitted as top/right/bottom/left longhands (measured Tamagui web output). */
  inset?: SpaceValue | InsetShorthand
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

/** The full View style-object surface: layout + universal styles + long tail. */
export type ViewCompatStyleProps = CompatStyleProps &
  ViewLayoutStyleProps &
  Omit<LongTailStyleProps, keyof (CompatStyleProps & ViewLayoutStyleProps)>

/** Pseudo-state style objects keyed to the View style surface. */
export type ViewCompatPseudoProps = CompatPseudoProps<ViewCompatStyleProps>

/** The full View prop contract: View styles + every shared compat surface. */
export type ViewCompatProps = CompatProps<ViewCompatStyleProps>
