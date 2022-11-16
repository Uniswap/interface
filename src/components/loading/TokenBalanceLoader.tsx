import React from 'react'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

export function TokenBalanceLoader() {
  return (
    <Flex row alignItems="center" gap="xs">
      <Text loading loadingPlaceholderText="$000.00" variant="subheadLarge" />
      <Text
        loading
        color="textSecondary"
        loadingPlaceholderText="(000.00 XXX)"
        variant="subheadLarge"
      />
    </Flex>
  )
}
