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
import { ActionProps, ElementName } from 'src/features/telemetry/constants'
import { TraceEvent } from 'src/features/telemetry/TraceEvent'
import { defaultHitslopInset } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

const ButtonActionProps = (({ onPress }) => ({ onPress }))(ActionProps)

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
  name?: ElementName | string
} & ComponentProps<typeof IconBaseButton>

export function IconButton({ icon, name, ...rest }: IconButtonProps) {
  const baseProps = { hitSlop: defaultHitslopInset, ...rest }
  const backgroundColor = rest.variant === 'primary' ? 'primary1' : 'none'
  return (
    <TraceEvent actionProps={ButtonActionProps} elementName={name} elementType="button">
      <IconBaseButton {...baseProps} backgroundColor={backgroundColor} p="md">
        {icon}
      </IconBaseButton>
    </TraceEvent>
  )
}
