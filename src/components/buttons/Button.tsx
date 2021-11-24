import {
  color as restyleColor,
  ColorProps,
  createRestyleComponent,
  createVariant,
  VariantProps,
} from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren } from 'react'
import { Pressable, PressableProps } from 'react-native'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { defaultHitslopInset } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

const BaseButton = createRestyleComponent<
  VariantProps<Theme, 'buttonVariants'> &
    ColorProps<Theme> &
    PressableProps &
    ComponentProps<typeof Box>,
  Theme
>([restyleColor, createVariant({ themeKey: 'buttonVariants' })], Pressable)

export type ButtonProps = {
  label?: string
} & ComponentProps<typeof BaseButton>

export function Button({ label, color, children, ...rest }: PropsWithChildren<ButtonProps>) {
  const baseProps = { hitSlop: defaultHitslopInset, ...rest }
  return (
    <BaseButton {...baseProps}>
      {label && (
        <Text variant="buttonLabel" color={color}>
          {label}
        </Text>
      )}
      {children}
    </BaseButton>
  )
}
