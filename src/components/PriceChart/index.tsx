import React, { ComponentProps, useMemo } from 'react'
import { Box } from 'src/components/layout/Box'
import { PriceChartError } from 'src/components/PriceChart/PriceChartError'
import { PriceExplorer } from 'src/components/PriceChart/PriceExplorer'
import { useTokenPriceGraphs } from 'src/components/PriceChart/TokenModel'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { useSpotPrice } from 'src/features/dataApi/spotPricesQuery'
import { theme as FixedTheme } from 'src/styles/theme'

export function CurrencyPriceChart({
  currencyId,
  tokenColor,
  tokenColorLoading,
}: {
  currencyId: string
  tokenColor?: NullUndefined<string>
  tokenColorLoading?: boolean
}) {
  const { data: graphs, loading, refetch } = useTokenPriceGraphs(currencyId)
  // using a separate query for spot price because 1/ most likely already cached
  // and 2/ `tokenPriceCharts` query is already computationally expensive on the backend
  const { data: spotPrice } = useSpotPrice(currencyId)

  const isLoading = loading || tokenColorLoading
  if (!isLoading && !graphs) {
    // assume error
    return <PriceChartError onRetry={refetch} />
  }

  return (
    <PriceChart
      graphs={graphs}
      headerCustomPercentChange={spotPrice?.pricePercentChange24h?.value}
      // ensures we show the latest spot price at rest
      headerCustomPrice={spotPrice?.price?.value}
      tokenColor={tokenColor}
    />
  )
}

export function PriceChart({
  graphs,
  tokenColor,
  ...rest
}: {
  graphs?: GraphMetadatas
  tokenColor?: NullUndefined<string>
} & Pick<ComponentProps<typeof PriceExplorer>, 'headerCustomPrice' | 'headerCustomPercentChange'>) {
  // require all graphs to be loaded before rendering the chart
  // TODO: [MOB-3875] improve loading state by lazy loading time ranges
  const loading = useMemo(() => graphs?.some((g) => !g.data), [graphs]) || graphs === undefined

  return (
    <Box overflow="hidden">
      <PriceExplorer
        chartColor={tokenColor ?? FixedTheme.colors.magentaVibrant}
        graphs={graphs}
        loading={loading}
        {...rest}
      />
    </Box>
  )
}
