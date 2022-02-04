import {
  BackgroundColorProps,
  BorderProps,
  SpacingProps,
  SpacingShorthandProps,
} from '@shopify/restyle'
import React, { memo } from 'react'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

type Props = {
  size: number
} & BackgroundColorProps<Theme> &
  BorderProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

function _EmptyCircle({ size, ...rest }: Props) {
  return (
    <Box
      alignItems="center"
      borderRadius="full"
      borderWidth={2}
      height={size}
      justifyContent="center"
      width={size}
      {...rest}
    />
  )
}

export const EmptyCircle = memo(_EmptyCircle)
