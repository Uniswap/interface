import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokenHistoryTVLResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { appendLiveSpotPriceEntry } from 'uniswap/src/components/charts/utils'
import { getGetTokenHistoryTVLQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { toRestHistoryDuration } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { isQueryLoading } from 'utilities/src/reactQuery/isQueryLoading'
import { StackedLineData } from '~/components/Charts/StackedLineChart'
import { ChartQueryResult, ChartType, checkDataQuality, getCurrentUTCTimestamp } from '~/components/Charts/utils'
import { useRestHistoryTarget } from '~/hooks/useRestHistoryTarget'
import type { TDPChartQueryVariables } from '~/pages/TokenDetails/components/chart/TDPChartState'

function selectTvlEntries(data: PlainMessage<GetTokenHistoryTVLResponse> | undefined): StackedLineData[] {
  return (
    data?.points
      .filter((point): point is typeof point & { tvlUsd: number } => point.tvlUsd !== undefined)
      .map((point) => ({ time: Number(point.timestamp) as UTCTimestamp, values: [point.tvlUsd] })) ?? []
  )
}

export function useTDPTVLChartData({
  variables,
  skip,
}: {
  variables: TDPChartQueryVariables
  skip: boolean
}): ChartQueryResult<StackedLineData, ChartType.TVL> {
  const target = useRestHistoryTarget(variables)
  const tvlQuery = useQuery(
    getGetTokenHistoryTVLQueryOptions({
      params: { target, duration: toRestHistoryDuration(variables.duration) },
      enabled: !skip && !!target,
      keepPreviousData: false,
      select: selectTvlEntries,
    }),
  )
  const restEntries = tvlQuery.data
  const restLoading = isQueryLoading(tvlQuery)
  const restIsError = tvlQuery.isError

  // REST history buckets lag "now" by their bucket granularity; append the live TVL stat (same
  // source StatsSection uses) so freshness matches the GraphQL path below, which does the same
  // with `totalValueLocked`. Derived from `variables` (the same chain/address the REST history
  // target uses, mirroring useTokenPriceChartPanel's spotCurrencyId) rather than a separate
  // `currency` prop, so the live point can never disagree with the curve on a multichain token
  // whose selected chain differs from the path token's chain.
  const chainId = useMemo(() => fromGraphQLChain(variables.chain), [variables.chain])
  const currencyIdValue = useMemo(() => {
    if (!variables.address) {
      return undefined
    }
    return chainId ? buildCurrencyId(chainId, variables.address) : undefined
  }, [chainId, variables.address])
  const { tvl: currentTvlV2 } = useTokenMarketStats(currencyIdValue ?? '', {
    isMultichainAggregateView: variables.multichain,
  })

  return useMemo(() => {
    const rawEntries = restEntries ?? []
    // Judge staleness on the real REST history bucket, not the appended live point below —
    // otherwise a healthy live stat masks a historical ingestion pipeline that's actually stale.
    const dataQuality = checkDataQuality({
      data: rawEntries,
      chartType: ChartType.TVL,
      duration: variables.duration,
    })
    const entries = appendLiveSpotPriceEntry({
      entries: rawEntries,
      currentPrice: currentTvlV2,
      now: getCurrentUTCTimestamp(),
      getTime: (entry) => entry.time,
      createEntry: ({ time, price }) => ({ time, values: [price] }),
      updateEntry: (entry, { time, price }) => ({ ...entry, time, values: [price] }),
    })
    return { chartType: ChartType.TVL, entries, loading: restLoading, dataQuality, isError: restIsError }
  }, [restEntries, currentTvlV2, restLoading, restIsError, variables.duration])
}
