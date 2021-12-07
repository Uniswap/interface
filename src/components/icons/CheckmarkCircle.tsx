import {
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  SpacingProps,
  SpacingShorthandProps,
} from '@shopify/restyle'
import React, { memo } from 'react'
import Checkmark from 'src/assets/icons/checkmark.svg'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

type Props = {
  size: number
  backgroundColor: string
} & BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

function _CheckmarkCircle({ size, ...rest }: Props) {
  return (
    <Box
      width={size}
      height={size}
      borderRadius="full"
      alignItems="center"
      justifyContent="center"
      {...rest}>
      <Checkmark height={size / 2} width={size / 2} stroke="white" />
    </Box>
  )
}

export const CheckmarkCircle = memo(_CheckmarkCircle)
