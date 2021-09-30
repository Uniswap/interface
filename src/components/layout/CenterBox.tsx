import { BoxProps } from '@shopify/restyle'
import React, { PropsWithChildren } from 'react'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

export const CenterBox = (props: PropsWithChildren<BoxProps<Theme, true>>) => {
  return <Box alignItems="center" justifyContent="center" {...props} />
}
