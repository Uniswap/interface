import React from 'react'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'

/* Box with a line at the bottom */
export function HeaderLoader() {
  return (
    <Flex shrink alignItems="flex-start" gap="xxs">
      <Box bg="background3" borderRadius="xs">
        <HiddenFromScreenReaders>
          <Text color="none" opacity={0} variant="headlineLarge">
            $00,000.00
          </Text>
        </HiddenFromScreenReaders>
      </Box>
      <Box bg="background3" borderRadius="xs">
        <HiddenFromScreenReaders>
          <Text color="none" opacity={0} variant="bodySmall">
            +000.00%
          </Text>
        </HiddenFromScreenReaders>
      </Box>
    </Flex>
  )
}
