import React from 'react'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Loading } from 'src/components/loading'

export function PriceChartLoading() {
  return (
    <Flex gap="lg" my="md">
      <Box mx="md">
        <Loading type="header" />
      </Box>
      <Loading type="graph" />
    </Flex>
  )
}
