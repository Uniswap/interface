import React from 'react'
import { Box, Flex } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'

const HIDDEN_TEXT_HEIGHT = 8

export default function TransactionLoader() {
  return (
    <Flex>
      <Box
        bg="background3"
        borderRadius="xs"
        maxHeight={HIDDEN_TEXT_HEIGHT}
        ml="xs"
        my="sm"
        width="30%">
        <HiddenFromScreenReaders>
          <Text color="none" opacity={0} variant="subheadSmall">
            Transaction Section Title
          </Text>
        </HiddenFromScreenReaders>
      </Box>
      <Loader.Token repeat={2} />
      <Box
        bg="background3"
        borderRadius="xs"
        maxHeight={HIDDEN_TEXT_HEIGHT}
        ml="xs"
        my="sm"
        width="30%">
        <HiddenFromScreenReaders>
          <Text color="none" opacity={0} variant="subheadSmall">
            Transaction Section Title
          </Text>
        </HiddenFromScreenReaders>
      </Box>
      <Loader.Token repeat={2} />
    </Flex>
  )
}
