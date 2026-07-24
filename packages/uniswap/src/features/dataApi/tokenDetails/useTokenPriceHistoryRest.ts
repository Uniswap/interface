import { type PartialMessage, type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type {
  GetTokenHistoryPriceResponse,
  GetTokenHistoryVolumeRequest,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { getGetTokenHistoryPriceQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import type { CurrencyId } from 'uniswap/src/types/currency'

/** Maps the GraphQL HistoryDuration used by chart query variables to its V2 REST equivalent. */
export function toRestHistoryDuration(duration: GraphQLApi.HistoryDuration): HistoryDuration {
  switch (duration) {
    case GraphQLApi.HistoryDuration.FiveMinute:
      return HistoryDuration.HOUR
    case GraphQLApi.HistoryDuration.Hour:
      return HistoryDuration.HOUR
    case GraphQLApi.HistoryDuration.Day:
      return HistoryDuration.DAY
    case GraphQLApi.HistoryDuration.Week:
      return HistoryDuration.WEEK
    case GraphQLApi.HistoryDuration.Month:
      return HistoryDuration.MONTH
    case GraphQLApi.HistoryDuration.Year:
      return HistoryDuration.YEAR
    case GraphQLApi.HistoryDuration.Max:
      return HistoryDuration.MAX
    default:
      return HistoryDuration.DAY
  }
}

/** Shared `target` oneof shape between GetTokenHistoryVolume/TVL/OHLC/Price requests (structurally identical). */
export type HistoryTarget = PartialMessage<GetTokenHistoryVolumeRequest>['target']

export function toHistoryTarget({
  chainId,
  address,
  multichain,
}: {
  chainId: number
  address: string
  multichain: boolean
}): HistoryTarget {
  const identifier = { chainId, address }
  if (multichain) {
    return { case: 'multichain', value: { identifier: { case: 'token', value: identifier } } }
  }
  return { case: 'singleChain', value: identifier }
}

export interface RestPriceHistoryPoint {
  /** unix seconds, bucket start */
  timestamp: number
  value: number
}

function selectPriceHistoryEntries(
  data: PlainMessage<GetTokenHistoryPriceResponse> | undefined,
): RestPriceHistoryPoint[] {
  return (data?.points ?? []).map((point) => ({ timestamp: Number(point.timestamp), value: point.priceUsd }))
}

export interface UseTokenPriceHistoryRestOptions {
  duration: HistoryDuration
  preferProjectMarketData?: boolean
  /** True for the "all networks" aggregate view of a genuinely multichain asset. */
  isMultichainAggregateView?: boolean
}

/**
 * REST price history entries for a token's line chart, gated by FeatureFlags.V2EndpointsTokens.
 *
 * RWA/project-market data has no REST equivalent yet, so preferProjectMarketData disables this
 * query entirely — callers must supply their own GraphQL/CoinGecko path for that case.
 */
export function useTokenPriceHistoryRest(
  currencyId: CurrencyId | undefined,
  options: UseTokenPriceHistoryRestOptions,
): { entries: RestPriceHistoryPoint[]; isLoading: boolean } {
  const { duration, preferProjectMarketData = false, isMultichainAggregateView = false } = options
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const shouldUseV2Tokens = isV2TokensEnabled && !preferProjectMarketData

  const target = useMemo(() => {
    if (!currencyId) {
      return undefined
    }
    const { chainId, address } = currencyIdToRestContractInput(currencyId)
    return toHistoryTarget({ chainId, address, multichain: isMultichainAggregateView })
  }, [currencyId, isMultichainAggregateView])

  const { data: entries, isLoading } = useQuery(
    getGetTokenHistoryPriceQueryOptions({
      params: target ? { target, duration } : undefined,
      enabled: shouldUseV2Tokens && !!target,
      select: selectPriceHistoryEntries,
    }),
  )

  return { entries: entries ?? [], isLoading }
}
