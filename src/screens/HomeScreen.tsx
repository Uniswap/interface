import React from 'react'
import { Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'

export function HomeScreen() {
  return (
    <Screen edges={['top', 'left', 'right']}>
      <Flex gap="md" mt="xl" mx="lg">
        <Text color="gray600" variant="h3">
          Under construction 🚧 🔨
        </Text>
      </Flex>
    </Screen>
  )
}
