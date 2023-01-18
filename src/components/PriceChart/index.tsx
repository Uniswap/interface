import React, { ComponentProps, useMemo } from 'react'
import { Box } from 'src/components/layout/Box'
import { PriceChartError } from 'src/components/PriceChart/PriceChartError'
import { PriceExplorer } from 'src/components/PriceChart/PriceExplorer'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { useSpotPrice } from 'src/features/dataApi/spotPricesQuery'
import { GqlResult } from 'src/features/dataApi/types'
import { theme as FixedTheme } from 'src/styles/theme'

export function CurrencyPriceChart({
  currencyId,
  tokenColor,
  tokenColorLoading,
  tokenPriceGraphResult,
  onRetry,
}: {
  currencyId: string
  tokenColor?: NullUndefined<string>
  tokenColorLoading?: boolean
  tokenPriceGraphResult: GqlResult<GraphMetadatas>
  onRetry: () => void
}): JSX.Element {
  const { data: graphs, loading, error, refetch } = tokenPriceGraphResult
  // using a separate query for spot price because
  // 1/ most likely already cached
  // 2/ `tokenPriceCharts` query is already computationally expensive on the backend
  const { data: spotPrice } = useSpotPrice(currencyId)

  const isLoading = loading || tokenColorLoading
  if (!isLoading && !graphs) {
    // Propagate retry up while refetching, if available
    const refetchAndRetry = (): void => {
      if (refetch) refetch()
      onRetry()
    }
    return <PriceChartError showRetry={error !== undefined} onRetry={refetchAndRetry} />
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
} & Pick<
  ComponentProps<typeof PriceExplorer>,
  'headerCustomPrice' | 'headerCustomPercentChange'
>): JSX.Element {
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
