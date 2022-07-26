import { ResponsiveValue, TextProps } from '@shopify/restyle'
import React, { PropsWithChildren } from 'react'
import { Button, ButtonProps } from 'src/components/buttons/Button'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

interface Props extends ButtonProps {
  textVariant?: ResponsiveValue<keyof Theme['textVariants'], Theme>
  textColor?: ResponsiveValue<keyof Theme['colors'], Theme>
  textAlign?: 'left' | 'center' | 'right'
  fontWeight?: TextProps<Theme>['fontWeight']
}

export function TextButton({
  textVariant,
  textColor,
  textAlign,
  children,
  fontWeight,
  ...rest
}: PropsWithChildren<Props>) {
  return (
    <Button {...rest}>
      <Text color={textColor} fontWeight={fontWeight} textAlign={textAlign} variant={textVariant}>
        {children}
      </Text>
    </Button>
  )
}
