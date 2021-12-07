import {
  backgroundColor,
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  border,
  BorderProps,
  color,
  ColorProps,
  layout,
  LayoutProps,
  spacing,
  SpacingProps,
  spacingShorthand,
  SpacingShorthandProps,
  typography,
  TypographyProps,
  useRestyle,
} from '@shopify/restyle'
import React from 'react'
import { TextInput as TextInputBase, TextInputProps as BaseTextInputProps } from 'react-native'
import { Theme } from 'src/styles/theme'

const restyleFunctions = [
  layout,
  typography,
  spacing,
  spacingShorthand,
  border,
  backgroundColor,
  color,
]
type RestyleProps = TypographyProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme> &
  LayoutProps<Theme> &
  SpacingShorthandProps<Theme> &
  BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  ColorProps<Theme>

export type TextInputProps = RestyleProps &
  BaseTextInputProps &
  Required<Pick<BaseTextInputProps, 'onChangeText'>>

export function TextInput({ onChangeText, onBlur, ...rest }: TextInputProps) {
  // Set defaults for style values
  rest.backgroundColor ??= 'mainBackground'
  rest.px ??= 'md'
  rest.py ??= 'sm'
  rest.color ??= 'mainForeground'
  rest.borderRadius ??= 'md'
  const transformedProps = useRestyle(restyleFunctions, rest)

  return <TextInputBase onChangeText={onChangeText} onBlur={onBlur} {...transformedProps} />
}
