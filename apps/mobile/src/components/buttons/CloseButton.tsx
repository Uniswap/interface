import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import XIcon from 'ui/src/assets/icons/x.svg'
import { Theme } from 'ui/src/theme/restyle'

type Props = {
  onPress: () => void
  size?: number
  strokeWidth?: number
  color?: keyof Theme['colors']
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function CloseButton({ onPress, size, strokeWidth, color, ...rest }: Props): JSX.Element {
  const theme = useAppTheme()
  return (
    <TouchableArea onPress={onPress} {...rest}>
      <XIcon
        color={theme.colors[color ?? 'sporeWhite']}
        height={size ?? 20}
        strokeWidth={strokeWidth ?? 2}
        width={size ?? 20}
      />
    </TouchableArea>
  )
}
