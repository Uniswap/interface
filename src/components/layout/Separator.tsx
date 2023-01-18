import { SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { Box } from 'src/components/layout'
import { Theme } from 'src/styles/theme'

export function Separator(props: SpacingShorthandProps<Theme>): JSX.Element {
  return (
    <Box
      borderBottomColor="backgroundOutline"
      borderBottomWidth={0.25}
      height={1}
      overflow="visible"
      {...props}
    />
  )
}
