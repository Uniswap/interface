import { createBox } from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren } from 'react'
import { Pressable, PressableProps } from 'react-native'
import { defaultHitslopInset } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

const PressableBox = createBox<Theme, PressableProps>(Pressable)

export type ButtonProps = ComponentProps<typeof PressableBox>

export function Button({ children, ...rest }: PropsWithChildren<ButtonProps>) {
  const baseProps = { hitSlop: defaultHitslopInset, ...rest }
  return <PressableBox {...baseProps}>{children}</PressableBox>
}
