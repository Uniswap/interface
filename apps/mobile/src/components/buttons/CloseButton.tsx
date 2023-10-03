import React from 'react'
import { ColorTokens, Icons, TouchableArea, TouchableAreaProps } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

type Props = {
  onPress: () => void
  size?: number
  strokeWidth?: number
  color?: ColorTokens
} & TouchableAreaProps

export function CloseButton({ onPress, size, strokeWidth, color, ...rest }: Props): JSX.Element {
  return (
    <TouchableArea onPress={onPress} {...rest}>
      <Icons.X color={color} size={size ?? iconSizes.icon20} strokeWidth={strokeWidth ?? 2} />
    </TouchableArea>
  )
}
