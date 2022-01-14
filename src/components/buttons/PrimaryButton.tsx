import { createRestyleComponent, createVariant, VariantProps } from '@shopify/restyle'
import React, { ComponentProps, ReactElement, useMemo } from 'react'
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
}

// A rounded, borderless, solid color button with optional icon left of text
function _PrimaryButton({ label, icon, textVariant, disabled, style, ...rest }: Props) {
  // Restyle variants do not have any mechanism for using a variant value on a child
  // This extracts the color style to apply it on the child Text
  const textColor = useMemo(
    () => rest.textColor || flattenStyleProp(style)?.color || '#FFFFFF',
    [style, rest.textColor]
  )

  return (
    <Button
      alignItems="center"
      borderRadius="lg"
      disabled={disabled}
      flexDirection="row"
      justifyContent="center"
      opacity={disabled ? 0.5 : 1}
      px="md"
      py="sm"
      style={style}
      {...rest}>
      {icon && <Box mr="sm">{icon}</Box>}
      <Text style={{ color: textColor }} textAlign="center" variant={textVariant ?? 'buttonLabel'}>
        {label}
      </Text>
    </Button>
  )
}

export const PrimaryButton = createRestyleComponent<
  VariantProps<Theme, 'primaryButtonVariants'> & ComponentProps<typeof _PrimaryButton>,
  Theme
>([createVariant({ themeKey: 'primaryButtonVariants' })], _PrimaryButton)
