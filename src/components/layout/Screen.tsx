import { createBox } from '@shopify/restyle'
import React, { PropsWithChildren } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Theme } from 'src/styles/theme'

const SafeAreaBox = createBox<Theme>(SafeAreaView)

export function Screen(props: PropsWithChildren<any>) {
  return (
    <SafeAreaBox flex={1} bg="mainBackground">
      {props.children}
    </SafeAreaBox>
  )
}
