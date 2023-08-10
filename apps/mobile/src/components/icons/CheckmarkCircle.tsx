import {
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  BorderProps,
  SpacingProps,
  SpacingShorthandProps,
} from '@shopify/restyle'
import React, { memo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout/Box'
import Checkmark from 'ui/src/assets/icons/checkmark.svg'
import { Theme } from 'ui/src/theme/restyle/theme'

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
        color={color ?? theme.colors.sporeWhite}
        height={size / 2}
        strokeWidth={checkmarkStrokeWidth}
        width={size / 2}
      />
    </Box>
  )
}

export const CheckmarkCircle = memo(_CheckmarkCircle)
