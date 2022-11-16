import { BoxProps } from '@shopify/restyle'
import React from 'react'
import { ViewProps } from 'react-native'
import { Box } from 'src/components/layout'
import { Theme } from 'src/styles/theme'

export function FavoriteLoader({ height, ...props }: BoxProps<Theme, true> & ViewProps) {
  return (
    <Box backgroundColor="backgroundOutline" borderRadius="lg" height={height ?? 50} {...props} />
  )
}
