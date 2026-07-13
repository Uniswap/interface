import { type PlainMessage } from '@bufbuild/protobuf'
import { ChartPeriod, type ChartPoint, WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useEffect, useMemo } from 'react'
import { type ChartData } from 'src/components/home/PortfolioChart/SparklineChart'
import { useSporeColors } from 'ui/src'
import { useGetPortfolioHistoricalValueChartQuery } from 'uniswap/src/data/rest/getPortfolioChart'
import { useWalletBalancesIncludeCategories } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/useRestPortfolioValueModifier'
import { logger } from 'utilities/src/logger/logger'

// API returns timestamps as bigint in seconds.
function toChartData(points: readonly PlainMessage<ChartPoint>[] | undefined): ChartData {
  if (!points || points.length === 0) {
    return []
  }
  return points.map((point) => ({ timestamp: Number(point.timestamp), value: point.value }))
}

export function usePortfolioChartData({
  evmAddress,
  chartPeriod,
  chainIds,
  enabled = true,
}: {
  evmAddress?: string
  chartPeriod: ChartPeriod
  chainIds?: number[]
  enabled?: boolean
}): {
  data: ChartData
  tokensData: ChartData
  poolsData: ChartData
  loading: boolean
  error: Error | null
  chartColor: string
} {
  const colors = useSporeColors()
  const includeCategories = useWalletBalancesIncludeCategories()
  const portfolioValueModifier = useRestPortfolioValueModifier(evmAddress)

  const {
    data: chartResponse,
    isPending,
    isFetching,
    error,
  } = useGetPortfolioHistoricalValueChartQuery({
    input: {
      evmAddress,
      chartPeriod,
      chainIds,
      includeCategories,
      ...(includeCategories.includes(WalletBalanceCategory.POOLS) && {
        poolIncludeOverrides: portfolioValueModifier?.poolIncludeOverrides,
        poolExcludeOverrides: portfolioValueModifier?.poolExcludeOverrides,
      }),
    },
    enabled: enabled && !!evmAddress,
  })

  useEffect(() => {
    if (error) {
      logger.warn('usePortfolioChartData', 'usePortfolioChartData', 'Portfolio chart query failed', {
        evmAddress,
        chartPeriod,
      })
    }
  }, [error, evmAddress, chartPeriod])

  const data = useMemo<ChartData>(() => toChartData(chartResponse?.points), [chartResponse?.points])
  const tokensData = useMemo<ChartData>(() => toChartData(chartResponse?.tokens), [chartResponse?.tokens])
  const poolsData = useMemo<ChartData>(() => toChartData(chartResponse?.pools), [chartResponse?.pools])

  const first = data[0]
  const last = data[data.length - 1]
  const chartColor = !first || !last || last.value >= first.value ? colors.statusSuccess.val : colors.statusCritical.val

  return {
    data,
    tokensData,
    poolsData,
    loading: isPending || isFetching,
    error: error ?? null,
    chartColor,
  }
}
