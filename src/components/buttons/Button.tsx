import {
  BackgroundColorProps,
  BorderProps,
  ColorProps,
  createBox,
  SpacingProps,
  SpacingShorthandProps,
} from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren } from 'react'
import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

const BaseButton = createBox<Theme, TouchableOpacityProps>(TouchableOpacity)

type RestyleProps = SpacingProps<Theme> &
  SpacingShorthandProps<Theme> &
  BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  ColorProps<Theme>

export type ButtonProps = {
  label?: string
  // Add more custom props here as needed
} & ComponentProps<typeof BaseButton> &
  RestyleProps

export function Button(props: PropsWithChildren<ButtonProps>) {
  const { label, color, children, ...rest } = props
  return (
    <BaseButton {...rest}>
      {label && (
        <Text variant="buttonLabel" color={color}>
          {label}
        </Text>
      )}
      {children}
    </BaseButton>
  )
}
