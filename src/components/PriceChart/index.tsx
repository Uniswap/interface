import { Currency } from '@uniswap/sdk-core'
import React, { ReactNode, Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { PriceChartLoading } from 'src/components/PriceChart/PriceChartLoading'
import { PriceExplorer } from 'src/components/PriceChart/PriceExplorer'
import { useTokenPriceGraphs } from 'src/components/PriceChart/TokenModel'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { Text } from 'src/components/Text'

export const CurrencyPriceChart = ({ currency }: { currency: Currency }) => {
  return (
    <Suspense fallback={<PriceChartLoading />}>
      <CurrencyPriceChartInner currency={currency} />
    </Suspense>
  )
}

function CurrencyPriceChartInner({ currency }: { currency: Currency }) {
  const graphs = useTokenPriceGraphs(currency.wrapped)
  const { t } = useTranslation()

  const error = graphs === null

  if (error) {
    return (
      <Flex centered mx="lg" my="md">
        <Text color="accentCritical" textAlign="center" variant="bodyLarge">
          {t('Could not retrieve price history')}
        </Text>
      </Flex>
    )
  }

  return <PriceChart graphs={graphs} />
}

export function PriceChart({
  graphs,
  customChartLabel,
}: {
  graphs?: GraphMetadatas
  customChartLabel?: ReactNode
}) {
  // require all graphs to be loaded before rendering the chart
  // TODO(judo): improve loading state
  const loading =
    useMemo(() => graphs?.some((g) => g.data === undefined), [graphs]) || graphs === undefined

  return (
    <Box overflow="hidden">
      {loading ? (
        <PriceChartLoading />
      ) : (
        <PriceExplorer customChartLabel={customChartLabel} graphs={graphs} />
      )}
    </Box>
  )
}
