import {
  backgroundColor,
  BackgroundColorProps,
  border,
  BorderProps,
  color,
  ColorProps,
  spacing,
  SpacingProps,
  spacingShorthand,
  SpacingShorthandProps,
  useRestyle,
} from '@shopify/restyle'
import React from 'react'
import { TextInput as TextInputBase, TextInputProps as BaseTextInputProps } from 'react-native'
import { Theme } from 'src/styles/theme'

const restyleFunctions = [spacing, spacingShorthand, border, backgroundColor, color]
type RestyleProps = SpacingProps<Theme> &
  SpacingShorthandProps<Theme> &
  BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  ColorProps<Theme>

export type TextInputProps = RestyleProps &
  BaseTextInputProps & {
    // Make onChangeText a required prop
    onChangeText: (text: string) => void
  }

export function TextInput(props: TextInputProps) {
  const { onChangeText, ...rest } = props
  // Set defaults for style values
  rest.backgroundColor ??= 'mainBackground'
  rest.px ??= 'md'
  rest.py ??= 'sm'
  rest.color ??= 'mainForeground'
  rest.borderWidth ??= 1
  rest.borderColor ??= 'gray400'
  rest.borderRadius ??= 'md'
  const transformedProps = useRestyle(restyleFunctions, rest)

  return <TextInputBase onChangeText={onChangeText} {...transformedProps} />
}
