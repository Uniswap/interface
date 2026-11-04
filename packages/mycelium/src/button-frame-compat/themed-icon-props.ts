/**
 * Prop contracts of `ThemedIconCompat` / `ThemedSpinnerCompat` — the rebuilt
 * legacy ui `ThemedIcon` / `ThemedSpinningLoader` surfaces: the button variant
 * selection as explicit props (legacy passes them per call, context is the
 * fallback), plus `typeOfButton`, which switches the icon box between the
 * label line-height sizes (`'button'`) and the `$icon.16/20/24` sizes
 * (`'icon'`, the IconButton lane).
 */
import type { JSX } from 'react'
import type { ColorValue } from '../compat/props'
import type { ButtonEmphasis, ButtonSize, ButtonVariant } from './compile'

export type TypeOfButton = 'button' | 'icon'

export interface ThemedIconCompatProps {
  variant?: ButtonVariant
  emphasis?: ButtonEmphasis
  size?: ButtonSize
  isDisabled?: boolean
  'custom-background-color'?: ColorValue
  typeOfButton: TypeOfButton
  children?: JSX.Element
  className?: string
}

export type ThemedSpinnerCompatProps = Omit<ThemedIconCompatProps, 'children' | 'className'>
