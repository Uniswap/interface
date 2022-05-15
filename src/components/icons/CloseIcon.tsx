import {
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  SpacingProps,
  SpacingShorthandProps,
} from '@shopify/restyle'
import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import X from 'src/assets/icons/x.svg'
import { Theme } from 'src/styles/theme'

type Props = {
  size: number
} & BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function CloseIcon({ size, ...rest }: Props) {
  const theme = useAppTheme()
  return <X color={theme.colors.white} height={size} strokeWidth={3} width={size} {...rest} />
}
