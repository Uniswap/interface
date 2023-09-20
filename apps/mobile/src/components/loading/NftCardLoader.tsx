import React from 'react'
import { Flex, FlexProps } from 'ui/src'

export function NftCardLoader({ ...props }: FlexProps): JSX.Element {
  return (
    <Flex fill justifyContent="flex-start" m="$spacing4" {...props}>
      <Flex aspectRatio={1} backgroundColor="$surface3" borderRadius="$rounded12" width="100%" />
    </Flex>
  )
}
