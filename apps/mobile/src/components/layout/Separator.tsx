import React from 'react'
import { ColorTokens, Flex, StackProps } from 'ui/src'

type SeparatorProps = {
  color?: ColorTokens
  width?: number
} & StackProps

export function Separator({
  color = '$neutral3',
  width = 0.25,
  ...rest
}: SeparatorProps): JSX.Element {
  return (
    <Flex
      borderBottomColor={color}
      borderBottomWidth={width}
      gap="$none"
      height={1}
      overflow="visible"
      {...rest}
    />
  )
}
