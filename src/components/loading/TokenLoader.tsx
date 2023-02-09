import React from 'react'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'
import { iconSizes } from 'src/styles/sizing'

interface TokenLoaderProps {
  opacity: number
}

export function TokenLoader({ opacity }: TokenLoaderProps): JSX.Element {
  return (
    <Flex
      row
      alignItems="center"
      gap="spacing12"
      justifyContent="space-between"
      opacity={opacity}
      overflow="hidden">
      <Box
        bg="background3"
        borderRadius="roundedFull"
        height={iconSizes.icon40}
        width={iconSizes.icon40}
      />
      <Flex shrink alignItems="flex-start" gap="spacing8" width="100%">
        <Box bg="background3" borderRadius="rounded4" width="80%">
          <HiddenFromScreenReaders>
            <Text color="none" opacity={0} variant="bodyLarge">
              Token Name
            </Text>
          </HiddenFromScreenReaders>
        </Box>
        <Box bg="background3" borderRadius="rounded4" width="30%">
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
