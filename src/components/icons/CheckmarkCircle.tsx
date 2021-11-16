import { BackgroundColorProps } from '@shopify/restyle'
import React, { memo } from 'react'
import Checkmark from 'src/assets/icons/checkmark.svg'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

type Props = {
  size: number
  backgroundColor: string
} & BackgroundColorProps<Theme>

function _CheckmarkCircle(props: Props) {
  const { size, ...rest } = props
  return (
    <Box
      width={size}
      height={size}
      borderRadius="full"
      alignItems="center"
      justifyContent="center"
      {...rest}>
      <Checkmark height={size / 2} width={size / 2} />
    </Box>
  )
}

export const CheckmarkCircle = memo(_CheckmarkCircle)
