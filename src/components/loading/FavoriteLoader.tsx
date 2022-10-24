import { BoxProps } from '@shopify/restyle'
import React from 'react'
import { ViewProps } from 'react-native'
import { Box } from 'src/components/layout'
import { Theme } from 'src/styles/theme'

export function FavoriteLoader({ ...props }: BoxProps<Theme, true> & ViewProps) {
  return <Box aspectRatio={1} backgroundColor="background3" borderRadius="lg" {...props} />
}
