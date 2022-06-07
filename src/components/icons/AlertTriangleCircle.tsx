import {
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  BorderProps,
  SpacingProps,
  SpacingShorthandProps,
} from '@shopify/restyle'
import React, { memo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

type Props = {
  size: number
  color?: string
} & BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

function _AlertTriangleCircle({ color, size, ...rest }: Props) {
  const theme = useAppTheme()
  return (
    <Box
      alignItems="center"
      borderRadius="full"
      height={size}
      justifyContent="center"
      width={size}
      {...rest}>
      <AlertTriangle color={color ?? theme.colors.white} height={size / 2} width={size / 2} />
    </Box>
  )
}

export const AlertTriangleCircle = memo(_AlertTriangleCircle)
