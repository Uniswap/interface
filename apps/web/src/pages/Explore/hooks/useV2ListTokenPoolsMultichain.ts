import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { normalizeTokenAddressForCache } from '@universe/chains'
import { useEffect, useMemo } from 'react'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { PoolTableSortState } from '~/data/pools/poolStats'
import { OrderDirection } from '~/data/util'
import { useInfiniteLoadMore } from '~/features/Explore/hooks/useInfiniteLoadMore'
import { poolSortFieldToOrderBy } from '~/features/Liquidity/utils/convertPoolToPoolStat'
import { getMultichainTokenListPoolsParams } from '~/features/Liquidity/utils/getTokenListPoolsParams'
import { useListPoolsAsPoolStats } from '~/pages/Explore/hooks/useListPoolsAsPoolStats'
import type { PoolStat } from '~/types/explore'

// Matches the single-chain TDP hook's page size (useV2ListTokenPools).
const TOKEN_LIST_POOLS_PAGE_SIZE = 20

/**
 * TDP "All networks" pools: a single ListPools request spanning every EVM deployment's chainId.
 * The request ANDs `chainIds` and the token filter as independent lists (no (chainId, address)
 * pair filter), so it can also return a pool that matched a deployment's address on a different
 * chain — e.g. a squatted same-address token. Those cross-matches are dropped client-side by
 * keeping only pools whose matched token is a real (chain, address) deployment pair.
 */
export function useV2ListTokenPoolsMultichain({
  entries,
  sortState,
  enabled = true,
}: {
  entries: MultichainTokenEntry[]
  sortState: PoolTableSortState
  enabled?: boolean
}): {
  pools: PoolStat[]
  isLoading: boolean
  isError: boolean
  loadMore: ({ onComplete }: { onComplete?: () => void }) => void
} {
  const orderBy = poolSortFieldToOrderBy[sortState.sortBy]
  const ascending = sortState.sortDirection === OrderDirection.Asc

  const request = useMemo(
    () =>
      getMultichainTokenListPoolsParams({
        entries,
        protocolVersions: [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4],
        sort: { orderBy, ascending },
      }),
    [entries, orderBy, ascending],
  )

  const {
    pools: fetchedPools,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListPoolsAsPoolStats({
    params: request?.params,
    pageSize: TOKEN_LIST_POOLS_PAGE_SIZE,
    enabled: enabled && !!request,
  })

  // Server-side sort order is preserved: filtering never reorders, and keyset pagination keeps
  // appended pages globally ordered, so no client-side re-sort is needed.
  const pools = useMemo(() => {
    const allowedByChain = request?.allowedAddressesByChain
    if (!allowedByChain) {
      return []
    }
    return (fetchedPools ?? []).filter((pool) => {
      const allowed = allowedByChain.get(pool.chainId)
      if (!allowed) {
        return false
      }
      const token0 = pool.token0?.address
      const token1 = pool.token1?.address
      return (
        (!!token0 && allowed.has(normalizeTokenAddressForCache(token0))) ||
        (!!token1 && allowed.has(normalizeTokenAddressForCache(token1)))
      )
    })
  }, [fetchedPools, request])

  // A page whose matches were all cross-chain squats renders zero rows, so nothing drives the
  // Table's scroll-triggered loadMore; advance to the next page directly until a real row (or the
  // end of the list) arrives. `!error` is load-bearing: a failed next-page fetch leaves every other
  // condition satisfied, so without it the effect re-fires indefinitely.
  useEffect(() => {
    if (!error && fetchedPools !== undefined && pools.length === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [error, fetchedPools, pools.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  })

  return {
    pools,
    // Auto-advancing with zero visible rows is still "loading" to the consumer — without this the
    // table flashes its empty state between fully-filtered pages.
    isLoading: isLoading || (pools.length === 0 && isFetchingNextPage),
    isError,
    loadMore,
  }
}
