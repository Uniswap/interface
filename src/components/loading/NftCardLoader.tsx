import React, { ComponentProps } from 'react'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

export function NftCardLoader({ ...props }: ComponentProps<typeof Box>) {
  return (
    <Box flex={1} justifyContent="flex-start" m="xs" {...props}>
      <Box aspectRatio={1} backgroundColor="background3" borderRadius="md" width="100%" />
      <Flex gap="none" py="xs">
        <Text
          loading
          height="80%"
          loadingPlaceholderText="Asset Name"
          numberOfLines={1}
          variant="bodyLarge"
          width="80%"
        />
        <Text
          loading
          height="80%"
          loadingPlaceholderText="Collection Name"
          numberOfLines={1}
          variant="bodySmall"
          width="60%"
        />
        <Text
          loading
          height="80%"
          loadingPlaceholderText="0.00 ETH"
          numberOfLines={1}
          variant="bodySmall"
          width="40%"
        />
      </Flex>
    </Box>
  )
}
