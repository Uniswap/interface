import React from 'react'
import { Flex, FlexProps } from 'ui/src'

export function NftCardLoader({ ...props }: FlexProps): JSX.Element {
  return (
    <Flex flex={1} gap="$none" justifyContent="flex-start" m="$spacing4" {...props}>
      <Flex
        aspectRatio={1}
        backgroundColor="$surface3"
        borderRadius="$rounded12"
        gap="$none"
        width="100%"
      />
    </Flex>
  )
}
