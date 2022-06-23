import React from 'react'
import { Box, Flex } from 'src/components/layout'

export function TokenLoader() {
  return (
    <Flex centered row gap="sm" height={50} mb="sm">
      <Box bg="backgroundContainer" borderRadius="full" height={35} width={35} />
      <Flex grow gap="xs">
        <Box bg="backgroundContainer" borderRadius="xs" height={20} />
        <Box bg="backgroundContainer" borderRadius="xs" height={16} width={100} />
      </Flex>
    </Flex>
  )
}
