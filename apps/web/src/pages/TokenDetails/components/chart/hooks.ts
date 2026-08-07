import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type {
  GetTokenHistoryTVLResponse,
  GetTokenHistoryVolumeResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { GraphQLApi } from '@universe/api'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import {
  getGetTokenHistoryTVLQueryOptions,
  getGetTokenHistoryVolumeQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useIsV2TokensEnabled } from 'uniswap/src/features/dataApi/tokenDetails/useIsV2TokensEnabled'
import { useTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { toRestHistoryDuration } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { StackedLineData } from '~/components/Charts/StackedLineChart'
import {
  appendCurrentValue,
  ChartQueryResult,
  ChartType,
  checkDataQuality,
  withUTCTimestamp,
} from '~/components/Charts/utils'
import { SingleHistogramData } from '~/components/Charts/VolumeChart/utils'
import { useRestHistoryTarget } from '~/hooks/useRestHistoryTarget'
import type { TokenPriceChartQueryVariables } from '~/hooks/useTokenPriceChartData'

export type TDPChartQueryVariables = TokenPriceChartQueryVariables

export const TDP_CHART_APOLLO_QUERY_NAMES = ['TokenHistoricalVolumes', 'TokenHistoricalTvls'] as const

function selectVolumeEntries(data: PlainMessage<GetTokenHistoryVolumeResponse> | undefined): SingleHistogramData[] {
  return (
    data?.buckets
      .filter((bucket): bucket is typeof bucket & { volumeUsd: number } => bucket.volumeUsd !== undefined)
      .map((bucket) => ({ time: Number(bucket.timestamp) as UTCTimestamp, value: bucket.volumeUsd })) ?? []
  )
}

export function useTDPVolumeChartData({
  variables,
  skip,
}: {
  variables: TDPChartQueryVariables
  skip: boolean
}): ChartQueryResult<SingleHistogramData, ChartType.VOLUME> {
  const isV2TokensEnabled = useIsV2TokensEnabled()

  const { data, loading } = GraphQLApi.useTokenHistoricalVolumesQuery({
    variables,
    skip: skip || isV2TokensEnabled,
  })
  const historicalVolume = data?.token?.market?.historicalVolume

  const target = useRestHistoryTarget(variables)
  const { data: restEntries, isPending: restLoading } = useQuery(
    getGetTokenHistoryVolumeQueryOptions({
      params: { target, duration: toRestHistoryDuration(variables.duration) },
      enabled: isV2TokensEnabled && !skip && !!target,
      select: selectVolumeEntries,
    }),
  )

  return useMemo(() => {
    const entries = isV2TokensEnabled
      ? (restEntries ?? [])
      : (historicalVolume
          ?.filter((v): v is GraphQLApi.PriceHistoryFallbackFragment => v !== undefined)
          .map(withUTCTimestamp) ?? [])
    const dataQuality = checkDataQuality({ data: entries, chartType: ChartType.VOLUME, duration: variables.duration })
    return { chartType: ChartType.VOLUME, entries, loading: isV2TokensEnabled ? restLoading : loading, dataQuality }
  }, [isV2TokensEnabled, restEntries, restLoading, historicalVolume, loading, variables.duration])
}

function toStackedLineData(entry: { timestamp: number; value: number }): StackedLineData {
  return { values: [entry.value], time: entry.timestamp as UTCTimestamp }
}

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
  const isV2TokensEnabled = useIsV2TokensEnabled()

  const { data, loading } = GraphQLApi.useTokenHistoricalTvlsQuery({ variables, skip: skip || isV2TokensEnabled })

  const target = useRestHistoryTarget(variables)
  const { data: restEntries, isPending: restLoading } = useQuery(
    getGetTokenHistoryTVLQueryOptions({
      params: { target, duration: toRestHistoryDuration(variables.duration) },
      enabled: isV2TokensEnabled && !skip && !!target,
      select: selectTvlEntries,
    }),
  )

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
    if (isV2TokensEnabled) {
      const rawEntries = restEntries ?? []
      // Judge staleness on the real REST history bucket, not the appended live point below —
      // otherwise a healthy live stat masks a historical ingestion pipeline that's actually stale.
      const dataQuality = checkDataQuality({
        data: rawEntries,
        chartType: ChartType.TVL,
        duration: variables.duration,
      })
      const entries = appendCurrentValue({
        entries: rawEntries,
        currentValue: currentTvlV2,
        buildEntry: (time, value) => ({ time, values: [value] }),
        withCurrentValue: (entry, { time, value }) => ({ ...entry, time, values: [value] }),
      })
      return { chartType: ChartType.TVL, entries, loading: restLoading, dataQuality }
    }

    const { historicalTvl, totalValueLocked } = data?.token?.market ?? {}
    const entries =
      historicalTvl
        ?.filter((v): v is GraphQLApi.PriceHistoryFallbackFragment => v !== undefined)
        .map(toStackedLineData) ?? []
    const currentTvl = totalValueLocked?.value

    // Judge staleness on the real historical bucket, not the appended live point below — otherwise
    // a healthy live stat masks a historical ingestion pipeline that's actually stale.
    const dataQuality = checkDataQuality({
      data: entries,
      chartType: ChartType.TVL,
      duration: variables.duration,
    })

    // Append current tvl to end of array to ensure data freshness and that each time period ends with same tvl
    const entriesWithCurrentTvl = appendCurrentValue({
      entries,
      currentValue: currentTvl,
      buildEntry: (time, value) => ({ time, values: [value] }),
      withCurrentValue: (entry, { time, value }) => ({ ...entry, time, values: [value] }),
    })

    return { chartType: ChartType.TVL, entries: entriesWithCurrentTvl, loading, dataQuality }
  }, [isV2TokensEnabled, restEntries, currentTvlV2, restLoading, data?.token?.market, loading, variables.duration])
}
