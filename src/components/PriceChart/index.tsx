import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Loading } from 'src/components/loading'
import { useGraphs } from 'src/components/PriceChart/Model'
import { PriceExplorer } from 'src/components/PriceChart/PriceExplorer'

interface PriceChartProps {
  currency: Currency
}

export const PriceChart = ({ currency }: PriceChartProps) => {
  const graphs = useGraphs(currency.wrapped)

  // require all graphs to be loaded before rendering the chart
  // TODO(judo): improve loading state
  const loading = useMemo(() => graphs?.some((g) => g.data === null), [graphs])

  const showLoading = loading || !graphs
  return (
    <Box overflow="hidden">
      {showLoading ? (
        <Flex gap="lg" my="md">
          <Box mx="md">
            <Loading type="header" />
          </Box>
          <Loading type="graph" />
        </Flex>
      ) : (
        <PriceExplorer graphs={graphs} />
      )}
    </Box>
  )
}
