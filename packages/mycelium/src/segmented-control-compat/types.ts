import type * as React from 'react'
import type { SegmentedControlGapToken } from './tokens'

/**
 * Prop surface of the legacy `ui/src` (Tamagui) SegmentedControl, reproduced
 * verbatim for the native rebuild (INFRA-2966). Only `gap` narrows: Tamagui's
 * open-ended `SpaceTokens` becomes the concrete Spore space-token union
 * (`SegmentedControlGapToken`), which covers every token the legacy scale
 * defines.
 */
export interface SegmentedControlOption<T extends string = string> {
  // String value to be selected/stored, used as default display value
  value: T
  // Optional display text, different from value
  displayText?: string
  // Optional custom display element
  display?: React.JSX.Element
  // Optional wrapper around the display element
  wrapper?: React.JSX.Element
  // Disable the specific option
  disabled?: boolean
  // Optional href to render as an anchor tag for proper link semantics
  // (native: link accessibility role only — there is no anchor element)
  href?: string
}

export type SegmentedControlSize = 'xsmall' | 'small' | 'smallThumbnail' | 'default' | 'large' | 'largeThumbnail'

export interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentedControlOption<T>[]
  selectedOption: T
  onSelectOption: (option: T) => void
  onHoverOption?: (option: T) => void
  size?: SegmentedControlSize
  disabled?: boolean
  fullWidth?: boolean
  // Size each option to its content instead of an equal split (mobile-web-like); requires fullWidth, ignored without it
  variableOptionWidths?: boolean
  outlined?: boolean
  gap?: SegmentedControlGapToken
  animateIndicator?: boolean
}
