import { BackgroundColorShorthandProps, createBox } from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren } from 'react'
import {
  NativeSafeAreaViewProps,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

const SafeAreaBox = createBox<Theme>(SafeAreaView)

type Props = BackgroundColorShorthandProps<Theme> &
  NativeSafeAreaViewProps &
  ComponentProps<typeof Box> & {
    // useful when screen has shared elements
    // uses `useSafeAreaInset` over `SafeAreaView` to avoid relayouts
    // which causes a jitter
    withSharedElementTransition?: boolean
  }

export function Screen(props: PropsWithChildren<Props>) {
  // helps avoid relayouts which causes an jitter with shared elements
  const insets = useSafeAreaInsets()
  if (props.withSharedElementTransition) {
    return (
      <Box
        bg="mainBackground"
        flex={1}
        style={{
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}>
        {props.children}
      </Box>
    )
  }

  return (
    <SafeAreaBox flex={1} {...props} bg="mainBackground">
      {props.children}
    </SafeAreaBox>
  )
}
