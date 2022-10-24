import React from 'react'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'
import { theme } from 'src/styles/theme'

interface TokenLoaderProps {
  opacity: number
}

export function TokenLoader({ opacity }: TokenLoaderProps) {
  return (
    <Flex
      row
      alignItems="center"
      gap="xs"
      justifyContent="space-between"
      opacity={opacity}
      overflow="hidden">
      <Box
        bg="background3"
        borderRadius="full"
        height={theme.imageSizes.xl}
        width={theme.imageSizes.xl}
      />
      <Flex shrink alignItems="flex-start" gap="xs" width="100%">
        <Box bg="background3" borderRadius="xs" width="80%">
          <HiddenFromScreenReaders>
            <Text color="none" opacity={0} variant="bodyLarge">
              Token Name
            </Text>
          </HiddenFromScreenReaders>
        </Box>
        <Box bg="background3" borderRadius="xs" width="30%">
          <HiddenFromScreenReaders>
            <Text color="none" opacity={0} variant="subheadSmall">
              Ticker
            </Text>
          </HiddenFromScreenReaders>
        </Box>
      </Flex>
    </Flex>
  )
}
