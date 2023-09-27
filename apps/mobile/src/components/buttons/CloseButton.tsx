import React from 'react'
import { ColorTokens, Icons, TouchableArea, TouchableAreaProps } from 'ui/src'

type Props = {
  onPress: () => void
  size?: number
  strokeWidth?: number
  color?: ColorTokens
} & TouchableAreaProps

export function CloseButton({ onPress, size, strokeWidth, color, ...rest }: Props): JSX.Element {
  return (
    <TouchableArea onPress={onPress} {...rest}>
      <Icons.X
        color={color}
        height={size ?? 20}
        strokeWidth={strokeWidth ?? 2}
        width={size ?? 20}
      />
    </TouchableArea>
  )
}
