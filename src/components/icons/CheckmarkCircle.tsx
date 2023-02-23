import {
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  BorderProps,
  SpacingProps,
  SpacingShorthandProps,
} from '@shopify/restyle'
import React, { memo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import Checkmark from 'src/assets/icons/checkmark.svg'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

type Props = {
  size: number
  checkmarkStrokeWidth?: number
  color?: string
} & BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

function _CheckmarkCircle({ color, checkmarkStrokeWidth = 3, size, ...rest }: Props): JSX.Element {
  const theme = useAppTheme()
  return (
    <Box
      alignItems="center"
      borderRadius="roundedFull"
      height={size}
      justifyContent="center"
      width={size}
      {...rest}>
      <Checkmark
        color={color ?? theme.colors.white}
        height={size / 2}
        strokeWidth={checkmarkStrokeWidth}
        width={size / 2}
      />
    </Box>
  )
}

export const CheckmarkCircle = memo(_CheckmarkCircle)
