/**
 * The TouchableArea-specific prop contract: the interactive-frame surface
 * (variant, hoverable/focusable, press scale/opacity, hit-slop and the
 * modifier-press escape hatch) composed with the shared compat surfaces
 * (`CompatProps`) to form `TouchableAreaCompatProps`.
 *
 * The parity suite in `packages/tailwind/src/parity/touchable-area` asserts at
 * the type level that this contract covers `TouchableAreaProps`
 * (`ui/src/components/touchable/TouchableArea/types`) up to an explicit
 * exclusion list.
 */
import type * as React from 'react'
import type {
  CompatProps,
  CompatPseudoProps,
  CompatStyleProps,
  DisplayValue,
  LongTailStyleProps,
  SizeValue,
  SpaceValue,
} from '../compat/props'

export type { GroupState, GroupStatePropKey, MediaPropKey } from '../compat/props'

export type TouchableAreaVariant = 'unstyled' | 'none' | 'outlined' | 'filled' | 'raised' | 'floating'

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

/**
 * The TouchableArea frame's layout surface: the frame's own `row`/`centered`
 * variants plus the YStack flexbox style props. Unlike Flex there is no
 * fill/inset/maxContent/shrink/grow shorthand — the legacy frame is a styled
 * YStack, not the Flex component.
 */
export interface TouchableAreaLayoutStyleProps {
  row?: boolean
  centered?: boolean

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

/**
 * Vendor-prefixed extras the legacy frame styles with (the floating variant
 * sets `WebkitBackdropFilter` beside `backdropFilter` — Safari only supports
 * the unprefixed property from Safari 18).
 */
export interface TouchableAreaWebkitStyleProps {
  WebkitBackdropFilter?: string
}

/** The full TouchableArea style-object surface: layout + universal styles + long tail. */
export type TouchableAreaCompatStyleProps = CompatStyleProps &
  TouchableAreaLayoutStyleProps &
  TouchableAreaWebkitStyleProps &
  Omit<LongTailStyleProps, keyof (CompatStyleProps & TouchableAreaLayoutStyleProps & TouchableAreaWebkitStyleProps)>

/** Pseudo-state style objects keyed to the TouchableArea style surface. */
export type TouchableAreaCompatPseudoProps = CompatPseudoProps<TouchableAreaCompatStyleProps>

export type TouchableAreaCompatEvent = React.MouseEvent<HTMLElement>

/**
 * Bivariant handler type: keeps parameter typing bivariant (like method
 * syntax) so handlers written against the legacy RN-flavored event types stay
 * assignable, while still allowing the `| null` the legacy contract accepts.
 */
type BivariantHandler<E> = { bivarianceHack(this: void, event: E): void }['bivarianceHack']

/** The press-family surface, nullable exactly like the legacy Tamagui typing. */
export interface TouchableAreaPressProps {
  onPress?: BivariantHandler<React.MouseEvent<HTMLElement>> | null
  onPressIn?: BivariantHandler<React.PointerEvent<HTMLElement>> | null
  onPressOut?: BivariantHandler<React.PointerEvent<HTMLElement>> | null
  onLongPress?: BivariantHandler<React.MouseEvent<HTMLElement>> | null
}

export interface TouchableAreaSpecificProps extends TouchableAreaPressProps {
  /** Frame variant, `unstyled` by default (the legacy component's default). */
  variant?: TouchableAreaVariant
  /** When false, the variant's hover styles are dropped (a user `hoverStyle` still applies). */
  hoverable?: boolean
  /** When false: `tabindex=-1`, no focus outline, and the focus-visible pool is neutralized. */
  focusable?: boolean
  /** Scale applied while pressed (merged into the press pool). */
  scaleTo?: number
  /** Opacity applied while pressed; 0.75 by default, falsy disables the opacity press state. */
  activeOpacity?: number
  /** Accepted for drop-in compatibility; native-only drag gating (no web effect). */
  ignoreDragEvents?: boolean
  /**
   * If true, enforces the minimum web touch target (24×24) by measuring the
   * element and pinning width/height when it is smaller. Explicit
   * width/height props are ignored while set, like the legacy component.
   */
  shouldConsiderMinimumDimensions?: boolean
  /** If true (default), press events stop propagation before dispatch. */
  shouldStopPropagation?: boolean
  /**
   * If true (web default), clones children injecting the Spore color
   * guidance: `color` (default $accent3), `backgroundColor`, and their
   * `$group-hover` hovered-token counterparts; disabled swaps the palette.
   */
  shouldAutomaticallyInjectColors?: boolean
  /** Web only: renders an `<a href>` so modifier clicks (meta/ctrl/shift/middle) navigate natively. */
  modifierPressHref?: string
  /** Called for modifier clicks when `modifierPressHref` is set. */
  onModifierPress?: BivariantHandler<React.MouseEvent<HTMLElement>>
}

/**
 * The full TouchableArea prop contract: TouchableArea styles + every shared
 * compat surface, with the press family widened to the legacy nullable typing.
 */
export type TouchableAreaCompatProps = Omit<CompatProps<TouchableAreaCompatStyleProps>, keyof TouchableAreaPressProps> &
  TouchableAreaSpecificProps
