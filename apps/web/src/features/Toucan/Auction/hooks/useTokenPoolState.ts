import { useInfiniteQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolsOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { EVMUniverseChainId } from '@universe/chains'
import { useCallback, useEffect, useMemo } from 'react'
import { getListPoolsInfiniteQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/pools/queries'
import type { TokenPoolState } from '~/types/tokenPool'
import { getTokenListPoolsParams } from '~/utils/getTokenListPoolsParams'

// Same request and page size as the TDP pools table at its default TVL sort (`useV2ListTokenPools`), so
// the two share a cache entry.
const TOKEN_LIST_POOLS_PAGE_SIZE = 20

/** Pool state for one non-native EVM token. */
export function useTokenPoolState({
  chainId,
  tokenAddress,
  enabled,
}: {
  chainId: EVMUniverseChainId | undefined
  tokenAddress: string | undefined
  enabled: boolean
}): { poolState: TokenPoolState; refetch: () => Promise<void> } {
  const poolsEnabled = enabled && chainId !== undefined && Boolean(tokenAddress)
  const params = useMemo(
    () =>
      getTokenListPoolsParams({
        chainId,
        tokenAddress,
        isNative: false,
        protocolVersions: [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4],
        sort: { orderBy: PoolsOrderBy.TVL, ascending: false },
      }),
    [chainId, tokenAddress],
  )
  const poolsQuery = useInfiniteQuery(
    getListPoolsInfiniteQueryOptions({ params, pageSize: TOKEN_LIST_POOLS_PAGE_SIZE, enabled: poolsEnabled }),
  )
  const { refetch: refetchPools } = poolsQuery
  // Counts raw rows: the auction only needs to know a pool exists, not that it normalizes.
  const rawPoolCount = poolsQuery.data?.pages.reduce((count, page) => count + page.pools.length, 0)

  const refetch = useCallback(async (): Promise<void> => {
    if (poolsEnabled) {
      await refetchPools({ cancelRefetch: false })
    }
  }, [poolsEnabled, refetchPools])

  useEffect(() => {
    // Refresh on mount and token changes without restarting an in-flight request.
    void refetch()
  }, [chainId, tokenAddress, refetch])

  if (poolsEnabled && poolsQuery.isError) {
    return { poolState: { status: 'error' }, refetch }
  }
  if (poolsEnabled && poolsQuery.isSuccess && poolsQuery.isFetchedAfterMount && rawPoolCount !== undefined) {
    // An empty filtered response means no pool; cached data alone is not enough.
    return { poolState: { status: 'success', poolCount: rawPoolCount }, refetch }
  }
  return { poolState: { status: 'loading' }, refetch }
}
