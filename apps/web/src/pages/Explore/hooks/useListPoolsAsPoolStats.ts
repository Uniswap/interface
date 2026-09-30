import type { PartialMessage } from '@bufbuild/protobuf'
import { InfiniteData, type RefetchOptions, useInfiniteQuery } from '@tanstack/react-query'
import type { ListPoolsRequest, ListPoolsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { useMemo } from 'react'
import { getListPoolsInfiniteQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/pools/queries'
import { convertPoolToPoolStat } from '~/features/Liquidity/utils/convertPoolToPoolStat'
import { normalizeRankedPool } from '~/features/Liquidity/utils/normalizeRankedPool'
import type { PoolStat } from '~/types/explore'

export interface ListPoolsAsPoolStatsResult {
  pools: PoolStat[] | undefined
  /** Backend-filtered rows in fetched pages, before client normalization. */
  rawPoolCount: number | undefined
  isLoading: boolean
  isSuccess: boolean
  isFetchedAfterMount: boolean
  refetch: (options?: RefetchOptions) => Promise<unknown>
  isError: boolean
  error: Error | null
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
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
}): ListPoolsAsPoolStatsResult {
  const {
    data,
    isLoading,
    isSuccess,
    isFetchedAfterMount,
    refetch,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(getListPoolsInfiniteQueryOptions({ params, pageSize, enabled, persist }))

  const infiniteData = data as InfiniteData<ListPoolsResponse> | undefined
  const rawPoolCount = useMemo(
    () => infiniteData?.pages.reduce((count, page) => count + page.pools.length, 0),
    [infiniteData?.pages],
  )
  const allPools = useMemo(
    () =>
      infiniteData?.pages.flatMap((page: ListPoolsResponse) =>
        page.pools.flatMap((rankedPool) => normalizeRankedPool(rankedPool) ?? []),
      ),
    [infiniteData?.pages],
  )

  const pools = useMemo(() => allPools?.map(convertPoolToPoolStat), [allPools])

  return {
    pools,
    rawPoolCount,
    isLoading,
    isSuccess,
    isFetchedAfterMount,
    refetch,
    isError: !!error,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  }
}
