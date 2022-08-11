import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { usePortfolioBalanceGraphs } from 'src/components/PriceChart/PortfolioModel'
import { PriceChartLoading } from 'src/components/PriceChart/PriceChartLoading'
import { PriceExplorer } from 'src/components/PriceChart/PriceExplorer'
import { useTokenPriceGraphs } from 'src/components/PriceChart/TokenModel'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { Text } from 'src/components/Text'

export const CurrencyPriceChart = ({ currency }: { currency: Currency }) => {
  const graphs = useTokenPriceGraphs(currency.wrapped)

  return <PriceChart graphs={graphs} />
}

export const PortfolioBalanceChart = ({ owner }: { owner: Address }) => {
  const graphs = usePortfolioBalanceGraphs(owner)

  return <PriceChart graphs={graphs} />
}

function PriceChart({ graphs }: { graphs: NullUndefined<GraphMetadatas> }) {
  const { t } = useTranslation()

  // require all graphs to be loaded before rendering the chart
  // TODO(judo): improve loading state
  const loading =
    useMemo(() => graphs?.some((g) => g.data === undefined), [graphs]) || graphs === undefined
  const error = graphs === null

  if (error) {
    // TODO(MOB-1553): improve portfolio chart error state
    return (
      <Flex centered mx="lg" my="md">
        <Text color="accentFailure" textAlign="center" variant="body">
          {t('Could not retrieve historical portfolio balances')}
        </Text>
      </Flex>
    )
  }

  return (
    <Box overflow="hidden">
      {loading ? <PriceChartLoading /> : <PriceExplorer graphs={graphs} />}
    </Box>
  )
}
