import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { PoolTableSortState } from '~/data/pools/poolStats'
import { OrderDirection } from '~/data/util'
import { useInfiniteLoadMore } from '~/features/Explore/hooks/useInfiniteLoadMore'
import { poolSortFieldToOrderBy } from '~/features/Liquidity/utils/convertPoolToPoolStat'
import { type ListPoolsAsPoolStatsResult, useListPoolsAsPoolStats } from '~/pages/Explore/hooks/useListPoolsAsPoolStats'
import { getTokenListPoolsParams } from '~/utils/getTokenListPoolsParams'

const TOKEN_LIST_POOLS_PAGE_SIZE = 20

type V2ListTokenPoolsResult = Omit<
  ListPoolsAsPoolStatsResult,
  'error' | 'fetchNextPage' | 'isFetchNextPageError' | 'isFetching' | 'isPlaceholderData'
> & {
  loadMore: ({ onComplete }: { onComplete?: () => void }) => void
}

/**
 * data.v2 ListPools scoped to one token, behind `usePoolsFromTokenAddress`. Single-chain only — multichain TDP views use
 * `useV2ListTokenPoolsMultichain`.
 */
export function useV2ListTokenPools({
  tokenAddress,
  chainId,
  isNative,
  sortState,
  enabled = true,
}: {
  tokenAddress: string | undefined
  chainId: UniverseChainId | undefined
  isNative?: boolean
  sortState: PoolTableSortState
  enabled?: boolean
}): V2ListTokenPoolsResult {
  const orderBy = poolSortFieldToOrderBy[sortState.sortBy]
  const ascending = sortState.sortDirection === OrderDirection.Asc

  const params = useMemo(
    () =>
      getTokenListPoolsParams({
        chainId,
        tokenAddress,
        isNative,
        protocolVersions: [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4],
        sort: { orderBy, ascending },
      }),
    [chainId, tokenAddress, isNative, orderBy, ascending],
  )

  const {
    pools,
    rawPoolCount,
    isLoading,
    isSuccess,
    isFetchedAfterMount,
    refetch,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListPoolsAsPoolStats({
    params,
    pageSize: TOKEN_LIST_POOLS_PAGE_SIZE,
    enabled: enabled && !!params,
  })

  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  })

  return {
    pools,
    rawPoolCount,
    isLoading,
    isSuccess,
    isFetchedAfterMount,
    refetch,
    isError,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
  }
}
