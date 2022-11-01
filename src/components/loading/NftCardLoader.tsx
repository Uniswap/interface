import React, { ComponentProps } from 'react'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

export function NftCardLoader({ ...props }: ComponentProps<typeof Box>) {
  return (
    <Box flex={1} justifyContent="flex-start" m="xs" {...props}>
      <Box aspectRatio={1} backgroundColor="background3" borderRadius="md" width="100%" />
      <Flex gap="none" py="xs">
        <Text loaderOnly height="80%" numberOfLines={1} variant="bodyLarge" width="80%">
          Asset Name
        </Text>
        <Text loaderOnly height="80%" numberOfLines={1} variant="bodySmall" width="60%">
          Collection Name
        </Text>
        <Text loaderOnly height="80%" numberOfLines={1} variant="bodySmall" width="40%">
          0.00 ETH
        </Text>
      </Flex>
    </Box>
  )
}
