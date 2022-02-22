import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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

  const { t } = useTranslation()

  const showLoading = loading || !graphs
  return (
    <Box margin="lg" overflow="hidden">
      {showLoading ? (
        <Flex gap="lg" mb="lg" mt="xl">
          <Loading type="header" />
          <Loading type="graph" />
        </Flex>
      ) : (
        <PriceExplorer graphs={graphs} title={currency.name ?? t('Unknown token')} />
      )}
    </Box>
  )
}
