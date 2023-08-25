import { SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { Box } from 'src/components/layout'
import { Theme } from 'ui/src/theme/restyle'

type SeparatorProps = {
  color?: keyof Theme['colors']
  width?: number
} & SpacingShorthandProps<Theme>

export function Separator({
  color = 'neutral3',
  width = 0.25,
  ...rest
}: SeparatorProps): JSX.Element {
  return (
    <Box
      borderBottomColor={color}
      borderBottomWidth={width}
      height={1}
      overflow="visible"
      {...rest}
    />
  )
}
