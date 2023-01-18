import React from 'react'
import { Box, BoxProps, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

export function NftCardLoader({ ...props }: BoxProps): JSX.Element {
  return (
    <Box flex={1} justifyContent="flex-start" m="xs" {...props}>
      <Box aspectRatio={1} backgroundColor="background3" borderRadius="md" width="100%" />
      <Flex gap="none" py="xs">
        <Text loading loadingPlaceholderText="corncobs.eth" numberOfLines={1} variant="bodyLarge" />
        <Text loading loadingPlaceholderText="Collection" numberOfLines={1} variant="bodySmall" />
        <Text loading loadingPlaceholderText="<0.001 ETH" numberOfLines={1} variant="bodySmall" />
      </Flex>
    </Box>
  )
}
