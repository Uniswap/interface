import React, { memo } from 'react'
import { ColorTokens, Flex } from 'ui/src'

type Props = {
  size?: number
  color?: ColorTokens
}

export const TripleDot = memo(function _TripleDot({ size = 5, color = '$neutral2' }: Props) {
  return (
    <Flex row gap="$spacing4">
      <Flex bg={color} borderRadius="$roundedFull" height={size} width={size} />
      <Flex bg={color} borderRadius="$roundedFull" height={size} width={size} />
      <Flex bg={color} borderRadius="$roundedFull" height={size} width={size} />
    </Flex>
  )
})
