import React from 'react'
import { Box } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'

const HIDDEN_TEXT_HEIGHT = 12

export default function TransactionLoader() {
  return (
    <Box>
      <Box
        bg="background3"
        borderRadius="xs"
        maxHeight={HIDDEN_TEXT_HEIGHT}
        ml="lg"
        my="sm"
        width="40%">
        <HiddenFromScreenReaders>
          <Text color="none" opacity={0} variant="subheadSmall">
            Transaction Section Title
          </Text>
        </HiddenFromScreenReaders>
      </Box>
      <Loading repeat={2} type="token" />
      <Box
        bg="background3"
        borderRadius="xs"
        maxHeight={HIDDEN_TEXT_HEIGHT}
        ml="lg"
        my="sm"
        width="40%">
        <HiddenFromScreenReaders>
          <Text color="none" opacity={0} variant="subheadSmall">
            Transaction Section Title
          </Text>
        </HiddenFromScreenReaders>
      </Box>
      <Loading repeat={4} type="token" />
    </Box>
  )
}
