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
}

// A rounded, borderless, solid color button with optional icon left of text
function _PrimaryButton({ label, icon, disabled, style, ...rest }: Props) {
  // Restyle variants do not have any mechanism for using a variant value on a child
  // This extracts the color style to apply it on the child Text
  const textColor = useMemo(() => flattenStyleProp(style)?.color ?? '#FFFFFF', [style])

  return (
    <Button
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      borderRadius="lg"
      py="md"
      px="md"
      style={style}
      disabled={disabled}
      opacity={disabled ? 0.5 : 1}
      {...rest}>
      {icon && <Box mr="sm">{icon}</Box>}
      <Text variant="buttonLabel" textAlign="center" style={{ color: textColor }}>
        {label}
      </Text>
    </Button>
  )
}

export const PrimaryButton = createRestyleComponent<
  VariantProps<Theme, 'primaryButtonVariants'> & ComponentProps<typeof _PrimaryButton>,
  Theme
>([createVariant({ themeKey: 'primaryButtonVariants' })], _PrimaryButton)
