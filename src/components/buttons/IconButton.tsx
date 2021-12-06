import {
  color as restyleColor,
  ColorProps,
  createBox,
  createRestyleComponent,
  createVariant,
  VariantProps,
} from '@shopify/restyle'
import React, { ComponentProps, ReactNode } from 'react'
import { Pressable, PressableProps } from 'react-native'
import { Box } from 'src/components/layout/Box'
import { defaultHitslopInset } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

const PressableBox = createBox(Pressable)

const IconBaseButton = createRestyleComponent<
  VariantProps<Theme, 'iconButtonVariants'> &
    ColorProps<Theme> &
    ComponentProps<typeof Box> &
    PressableProps,
  Theme
>([restyleColor, createVariant({ themeKey: 'iconButtonVariants' })], PressableBox)

type IconButtonProps = {
  icon: ReactNode
} & ComponentProps<typeof IconBaseButton>

export function IconButton({ icon, ...rest }: IconButtonProps) {
  const baseProps = { hitSlop: defaultHitslopInset, ...rest }
  const backgroundColor = rest.variant === 'primary' ? 'primary1' : 'secondary1'
  return (
    <IconBaseButton {...baseProps} backgroundColor={backgroundColor} p="md">
      {icon}
    </IconBaseButton>
  )
}
