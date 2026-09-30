import { type PartialMessage, type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type {
  GetTokenHistoryPriceResponse,
  GetTokenHistoryVolumeRequest,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration as RestHistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useMemo } from 'react'
import { getGetTokenHistoryPriceQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import type { CurrencyId } from 'uniswap/src/types/currency'
import { isQueryLoading } from 'utilities/src/reactQuery/isQueryLoading'

const REST_HISTORY_DURATION: Record<HistoryDuration, RestHistoryDuration> = {
  [HistoryDuration.Hour]: RestHistoryDuration.HOUR,
  [HistoryDuration.Day]: RestHistoryDuration.DAY,
  [HistoryDuration.Week]: RestHistoryDuration.WEEK,
  [HistoryDuration.Month]: RestHistoryDuration.MONTH,
  [HistoryDuration.Year]: RestHistoryDuration.YEAR,
  [HistoryDuration.Max]: RestHistoryDuration.MAX,
}

/** Maps the app-level HistoryDuration to the data-api V2 request enum. */
export function toRestHistoryDuration(duration: HistoryDuration): RestHistoryDuration {
  return REST_HISTORY_DURATION[duration]
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
  /** True for the "all networks" aggregate view of a genuinely multichain asset. */
  isMultichainAggregateView?: boolean
}

export function useTokenPriceHistoryRest(
  currencyId: CurrencyId | undefined,
  options: UseTokenPriceHistoryRestOptions,
): { entries: RestPriceHistoryPoint[]; isLoading: boolean; error: Error | null } {
  const { duration, isMultichainAggregateView = false } = options

  const target = useMemo(() => {
    if (!currencyId) {
      return undefined
    }
    const { chainId, address } = currencyIdToRestContractInput(currencyId)
    return toHistoryTarget({ chainId, address, multichain: isMultichainAggregateView })
  }, [currencyId, isMultichainAggregateView])

  const query = useQuery(
    getGetTokenHistoryPriceQueryOptions({
      params: target ? { target, duration: toRestHistoryDuration(duration) } : undefined,
      enabled: !!target,
      // A period switch is a new chart, not a refetch: show the skeleton, not the previous period's line.
      keepPreviousData: false,
      select: selectPriceHistoryEntries,
    }),
  )

  return { entries: query.data ?? [], isLoading: isQueryLoading(query), error: query.error }
}
