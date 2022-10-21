import { BackgroundColorShorthandProps, createBox } from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren } from 'react'
import { NativeSafeAreaViewProps, SafeAreaView } from 'react-native-safe-area-context'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

const SafeAreaBox = createBox<Theme>(SafeAreaView)

type Props = BackgroundColorShorthandProps<Theme> &
  NativeSafeAreaViewProps &
  ComponentProps<typeof Box>

export function Screen(props: PropsWithChildren<Props>) {
  return (
    <SafeAreaBox flex={1} {...props} bg="background0">
      {props.children}
    </SafeAreaBox>
  )
}
