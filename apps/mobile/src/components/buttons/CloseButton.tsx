import React from 'react'
import { ColorTokens, IconProps, Icons, TouchableArea, TouchableAreaProps } from 'ui/src'

type Props = {
  onPress: () => void
  size?: IconProps['size']
  strokeWidth?: number
  color?: ColorTokens
} & TouchableAreaProps

export function CloseButton({ onPress, size, strokeWidth, color, ...rest }: Props): JSX.Element {
  return (
    <TouchableArea onPress={onPress} {...rest} testID="buttons/close-button">
      <Icons.X color={color} size={size ?? '$icon.20'} strokeWidth={strokeWidth ?? 2} />
    </TouchableArea>
  )
}
