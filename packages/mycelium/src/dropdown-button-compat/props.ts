import type { ComponentProps, JSX } from 'react'
import type { ButtonSize } from '../button-frame-compat/compile'
import type { ButtonFrameCompatProps } from '../button-frame-compat/props'
import type { RotatableChevron } from '../components/icons/RotatableChevron'

/** 'grouped' pairs the icon and label into one flex group instead of spacing them across the frame. A layout decision of `DropdownButtonCompat` only; the frame does not style off it. */
export type DropdownButtonElementPositioning = 'equal' | 'grouped'

export type DropdownButtonCompatProps = Omit<
  ButtonFrameCompatProps,
  'size' | 'iconPosition' | 'variant' | 'justifyContent' | 'isDisabled'
> & {
  size?: Extract<ButtonSize, 'small' | 'medium' | 'large'>
  /** Themed and sized from the button's emphasis and size, like `Button`'s `icon`. */
  icon?: JSX.Element
  isExpanded: boolean
  elementPositioning?: DropdownButtonElementPositioning
  /** Paints the trailing chevron independently of the label. Omit to inherit the emphasis text color. */
  chevronColor?: ComponentProps<typeof RotatableChevron>['color']
  /** Sizes the trailing chevron. Omit to keep the glyph's own 24px default; the frame carries no default `size` of its own. */
  chevronSize?: ComponentProps<typeof RotatableChevron>['size']
}
