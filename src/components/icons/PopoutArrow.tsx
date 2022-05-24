import {
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  SpacingProps,
  SpacingShorthandProps,
} from '@shopify/restyle'
import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import ArrowDown from 'src/assets/icons/arrow-down.svg'
import { Theme } from 'src/styles/theme'

type Props = {
  size: number
  color?: string
} & BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function PopoutArrow({ size, color, ...rest }: Props) {
  const theme = useAppTheme()
  return (
    <ArrowDown
      color={color || theme.colors.white}
      height={size}
      strokeWidth={3}
      style={{ transform: [{ rotate: '225deg' }] }}
      width={size}
      {...rest}
    />
  )
}
