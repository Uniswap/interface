import {
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  SpacingProps,
  SpacingShorthandProps,
} from '@shopify/restyle'
import React, { memo } from 'react'
import Dash from 'src/assets/icons/dash.svg'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

type Props = {
  size: number
  backgroundColor: string
} & BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

function _DashCircle({ size, ...rest }: Props) {
  return (
    <Box
      alignItems="center"
      borderRadius="full"
      height={size}
      justifyContent="center"
      width={size}
      {...rest}>
      <Dash height={size / 2} width={size / 2} />
    </Box>
  )
}

export const DashCircle = memo(_DashCircle)
