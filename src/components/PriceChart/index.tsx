import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { Inset } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Graph } from 'src/components/PriceChart/Graph'
import { useGraphs } from 'src/components/PriceChart/Model'

interface PriceChartProps {
  currency: Currency
}

export const PriceChart = ({ currency }: PriceChartProps) => {
  const graphs = useGraphs(currency.wrapped)

  // require all graphs to be loaded before rendering the chart
  // TODO(judo): improve loading state
  const loading = useMemo(() => graphs?.some((g) => g.data === null), [graphs])

  const { t } = useTranslation()

  return (
    <Box flex={1} margin="lg" overflow="hidden">
      {loading || !graphs ? (
        <Inset all="xxl">
          <ActivityIndicator />
        </Inset>
      ) : (
        <Graph graphs={graphs} title={currency.name ?? t('Unknown token')} />
      )}
    </Box>
  )
}
