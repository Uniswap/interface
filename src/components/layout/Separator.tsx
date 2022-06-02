import { SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { Box } from 'src/components/layout'
import { Theme } from 'src/styles/theme'

export function Separator(props: SpacingShorthandProps<Theme>) {
  return <Box bg="neutralOutline" height={0.5} {...props} />
}
