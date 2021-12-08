import { BackgroundColorShorthandProps } from '@shopify/restyle'
import React, { PropsWithChildren } from 'react'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

type Props = BackgroundColorShorthandProps<Theme>

export function Screen(props: PropsWithChildren<Props>) {
  return (
    <Box pt="xxl" flex={1} bg="mainBackground" {...props}>
      {props.children}
    </Box>
  )
}
