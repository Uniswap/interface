import type { PartialMessage, PlainMessage } from '@bufbuild/protobuf'
import { type InfiniteData, keepPreviousData, type RefetchOptions, useInfiniteQuery } from '@tanstack/react-query'
import type { ListPoolsRequest, ListPoolsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { RankedPool } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { getListPoolsInfiniteQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/pools/queries'
import { logger } from 'utilities/src/logger/logger'
import { convertPoolToPoolStat } from '~/features/Liquidity/utils/convertPoolToPoolStat'
import { normalizeRankedPool } from '~/features/Liquidity/utils/normalizeRankedPool'
import type { PoolStat } from '~/types/explore'

export interface ListPoolsAsPoolStatsResult {
  pools: PoolStat[] | undefined
  /** Backend-filtered rows in fetched pages, before client normalization. */
  rawPoolCount: number | undefined
  isLoading: boolean
  isFetching: boolean
  isPlaceholderData: boolean
  isSuccess: boolean
  isFetchedAfterMount: boolean
  refetch: (options?: RefetchOptions) => Promise<unknown>
  isError: boolean
  error: Error | null
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
}

// A throw inside `select` fails the whole query with no retry and no log, so a bad row is dropped instead.
function toPoolStat(rankedPool: PlainMessage<RankedPool>): PoolStat | undefined {
  try {
    const pool = normalizeRankedPool(rankedPool)
    if (!pool) {
      return undefined
    }
    // Canonical Pool uses zero for missing TVL; PoolStat must retain the served availability.
    const tvl = rankedPool.stats?.tvl
    return {
      ...convertPoolToPoolStat(pool),
      totalLiquidity: tvl !== undefined && Number.isFinite(tvl) ? { value: tvl } : undefined,
    }
  } catch (error) {
    logger.warn('useListPoolsAsPoolStats', 'toPoolStat', 'Dropped unconvertible pool', {
      poolId: rankedPool.pool?.poolId,
      error,
    })
    return undefined
  }
}

function selectPoolStats(data: InfiniteData<PlainMessage<ListPoolsResponse>>): {
  pools: PoolStat[]
  rawPoolCount: number
} {
  // Persisted pages can predate the current response shape, so a missing `pools` reads as empty.
  // oxlint-disable-next-line typescript/no-unnecessary-condition -- rehydrated cache isn't type-checked
  const pages = data.pages.map((page) => page.pools ?? [])
  return {
    pools: pages.flatMap((pools) => pools.flatMap((rankedPool) => toPoolStat(rankedPool) ?? [])),
    rawPoolCount: pages.reduce((count, pools) => count + pools.length, 0),
  }
}

/**
 * Shared data.v2 ListPools → PoolStat[] pipeline: fetch, normalize, and convert. Used by
 * `useV2ListPools` (the ranked list behind Explore and the pool browser) and `useV2ListTokenPools`
 * (TDP), which layer their own request params on top.
 *
 * `loadMore` isn't built here — callers build their own via `useInfiniteLoadMore` from the
 * returned `fetchNextPage`/`hasNextPage`/`isFetchingNextPage`.
 */
export function useListPoolsAsPoolStats({
  params,
  pageSize,
  enabled,
  persist,
  keepPreviousRows,
}: {
  params: Omit<PartialMessage<ListPoolsRequest>, 'page'> | undefined
  pageSize: number
  enabled: boolean
  /**
   * Whether the fetched pages join the persisted react-query cache (localStorage, see
   * PersistQueryClient). Persisted pages let a return visit paint the table from the last session's
   * rows while the fresh fetch is in flight, instead of a skeleton. Defaults to persisted.
   */
  persist?: boolean
  keepPreviousRows?: boolean
}): ListPoolsAsPoolStatsResult {
  const {
    data,
    isLoading,
    isFetching,
    isPlaceholderData,
    isSuccess,
    isFetchedAfterMount,
    refetch,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    ...getListPoolsInfiniteQueryOptions({ params, pageSize, enabled, persist }),
    placeholderData: keepPreviousRows ? keepPreviousData : undefined,
    select: selectPoolStats,
  })

  return {
    pools: data?.pools,
    rawPoolCount: data?.rawPoolCount,
    isLoading,
    isFetching,
    isPlaceholderData,
    isSuccess,
    isFetchedAfterMount,
    refetch,
    isError: !!error,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  }
}
