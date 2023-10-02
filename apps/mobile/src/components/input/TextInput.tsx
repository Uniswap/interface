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
  useTheme,
} from '@shopify/restyle'
import React, { forwardRef } from 'react'
import { TextInput as TextInputBase, TextInputProps as BaseTextInputProps } from 'react-native'
import { fonts } from 'ui/src/theme'
import { Theme } from 'ui/src/theme/restyle'

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
  LayoutProps<Theme> &
  SpacingShorthandProps<Theme> &
  BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  ColorProps<Theme>

export type TextInputProps = RestyleProps & BaseTextInputProps

export const TextInput = forwardRef<TextInputBase, TextInputProps>(function _TextInput(
  { onChangeText, onBlur, ...rest },
  ref
) {
  const theme = useTheme<Theme>()

  // Set defaults for style values
  rest.backgroundColor ??= 'surface1'
  rest.px ??= 'spacing16'
  rest.py ??= 'spacing12'
  rest.color ??= 'neutral1'
  rest.borderRadius ??= 'rounded12'
  rest.fontFamily ??= fonts.body1.family

  // restyle doesn't parse placeholderTextColorCorrectly
  rest.placeholderTextColor ??= theme.colors.neutral3

  const transformedProps = useRestyle(restyleFunctions, rest)

  return (
    <TextInputBase
      ref={ref}
      autoComplete="off"
      selectionColor={theme.colors.neutral3}
      onBlur={onBlur}
      onChangeText={onChangeText}
      {...transformedProps}
    />
  )
})
