import {
  createRestyleComponent,
  createVariant,
  SpacingShorthandProps,
  VariantProps,
} from '@shopify/restyle'
import React, { ComponentProps, ReactElement, useMemo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Button, ButtonProps } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'
import { flattenStyleProp } from 'src/styles/utils'

type Props = ButtonProps & {
  label: string
  icon?: ReactElement
  textVariant?: keyof Theme['textVariants']
  textColor?: keyof Theme['colors']
  noTextScaling?: boolean
  iconLabelSpacing?: keyof Theme['spacing']
} & SpacingShorthandProps<Theme>

// A rounded, borderless, solid color button with optional icon left of text
function _PrimaryButton({
  label,
  icon,
  textVariant,
  disabled,
  style,
  p,
  px,
  py,
  noTextScaling,
  iconLabelSpacing,
  ...rest
}: Props) {
  const theme = useAppTheme()

  // Restyle variants do not have any mechanism for using a variant value on a child
  // This extracts the color style to apply it on the child Text

  const textColor = useMemo(
    () =>
      (rest.textColor && theme.colors[rest.textColor]) ||
      flattenStyleProp(style)?.color ||
      theme.colors.textPrimary,
    [theme.colors, rest.textColor, style]
  )

  return (
    <Button
      alignItems="center"
      borderRadius="lg"
      disabled={disabled}
      flexDirection="row"
      justifyContent="center"
      opacity={disabled ? 0.6 : 1}
      px={p ?? px ?? 'md'}
      py={p ?? py ?? 'sm'}
      style={style}
      {...rest}>
      {icon && <Box mr={iconLabelSpacing ?? 'xs'}>{icon}</Box>}
      <Text
        noTextScaling={noTextScaling}
        style={{ color: textColor }}
        textAlign="center"
        variant={textVariant ?? 'buttonLabelMedium'}>
        {label}
      </Text>
    </Button>
  )
}

export const PrimaryButton = createRestyleComponent<
  VariantProps<Theme, 'primaryButtonVariants'> & ComponentProps<typeof _PrimaryButton>,
  Theme
>([createVariant({ themeKey: 'primaryButtonVariants' })], _PrimaryButton)
