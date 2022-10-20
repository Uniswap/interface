import React from 'react'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'

export function TokenLoader() {
  return (
    <Flex row alignItems="center" justifyContent="space-between" overflow="hidden" p="sm">
      <Flex centered row gap="xs">
        <Box bg="backgroundAction" borderRadius="full" height={32} width={32} />
        <Flex shrink alignItems="flex-start" gap="none" width="100%">
          <Box bg="backgroundAction" borderRadius="xs" width="100%">
            <HiddenFromScreenReaders>
              <Text color="none" opacity={0} variant="bodyLarge">
                Token Name
              </Text>
            </HiddenFromScreenReaders>
          </Box>
          <Flex row alignItems="center" pt="xxs" width="100%">
            <Box bg="backgroundAction" borderRadius="xs" width="25%">
              <HiddenFromScreenReaders>
                <Text color="none" opacity={0} variant="subheadSmall">
                  Ticker
                </Text>
              </HiddenFromScreenReaders>
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
