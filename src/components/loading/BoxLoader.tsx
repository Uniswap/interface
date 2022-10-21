import { BoxProps } from '@shopify/restyle'
import React from 'react'
import { ViewProps } from 'react-native'
import { Box } from 'src/components/layout'
import { Theme } from 'src/styles/theme'

export function BoxLoader({ ...props }: BoxProps<Theme, true> & ViewProps) {
  return <Box backgroundColor="background3" borderRadius="md" width="100%" {...props} />
}
