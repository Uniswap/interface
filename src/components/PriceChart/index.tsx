import { Currency } from '@uniswap/sdk-core'
import React, { ComponentProps, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { PriceChartLoading } from 'src/components/PriceChart/PriceChartLoading'
import { PriceExplorer } from 'src/components/PriceChart/PriceExplorer'
import { useTokenPriceGraphs } from 'src/components/PriceChart/TokenModel'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { Text } from 'src/components/Text'
import { useSpotPrice } from 'src/features/dataApi/spotPricesQuery'

export function CurrencyPriceChart({ currency }: { currency: Currency }) {
  const { t } = useTranslation()

  const { data: graphs, loading, error } = useTokenPriceGraphs(currency.wrapped)
  // using a separate query for spot price because 1/ most likely already cached
  // and 2/ `tokenPriceCharts` query is already computationally expensive on the backend
  const { data: spotPrice } = useSpotPrice(currency)

  if (error) {
    return (
      <Flex centered mx="lg" my="md">
        <Text color="accentCritical" textAlign="center" variant="bodyLarge">
          {t('Could not retrieve price history')}
        </Text>
      </Flex>
    )
  }

  if (!graphs && loading) {
    return <PriceChartLoading />
  }

  return (
    <PriceChart
      graphs={graphs}
      // ensures we show the latest spot price at rest
      headerCustomPercentChange={spotPrice?.pricePercentChange24h?.value}
      headerCustomPrice={spotPrice?.price?.value}
    />
  )
}

export function PriceChart({
  graphs,
  ...rest
}: {
  graphs?: GraphMetadatas
} & Pick<ComponentProps<typeof PriceExplorer>, 'headerCustomPrice' | 'headerCustomPercentChange'>) {
  // require all graphs to be loaded before rendering the chart
  // TODO(judo): improve loading state
  const loading =
    useMemo(() => graphs?.some((g) => g.data === undefined), [graphs]) || graphs === undefined

  return (
    <Box overflow="hidden">
      {loading ? <PriceChartLoading /> : <PriceExplorer graphs={graphs} {...rest} />}
    </Box>
  )
}
