import React from 'react'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

export function TokenBalanceLoader() {
  return (
    <Flex row alignItems="center" gap="xs">
      <Text loaderOnly variant="subheadLarge">
        $000.00
      </Text>
      <Text loaderOnly color="textSecondary" variant="subheadLarge">
        (000.00 XXX)
      </Text>
    </Flex>
  )
}
