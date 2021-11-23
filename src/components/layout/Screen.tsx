import { BackgroundColorShorthandProps, createBox } from '@shopify/restyle'
import React, { PropsWithChildren } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Theme } from 'src/styles/theme'

const SafeAreaBox = createBox<Theme>(SafeAreaView)

type Props = BackgroundColorShorthandProps<Theme>

export function Screen(props: PropsWithChildren<Props>) {
  return (
    <SafeAreaBox flex={1} bg="mainBackground" {...props}>
      {props.children}
    </SafeAreaBox>
  )
}
