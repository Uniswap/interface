import type { EVMUniverseChainId } from '@universe/chains'
import { useCallback, useEffect } from 'react'
import { PoolSortFields } from '~/data/pools/poolStats'
import { OrderDirection } from '~/data/util'
import { useV2ListTokenPools } from '~/pages/Explore/hooks/useV2ListTokenPools'
import type { TokenPoolState } from '~/types/tokenPool'

const poolSortState = { sortBy: PoolSortFields.TVL, sortDirection: OrderDirection.Desc }

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
  const poolsQuery = useV2ListTokenPools({
    chainId,
    tokenAddress,
    isNative: false,
    sortState: poolSortState,
    enabled: poolsEnabled,
  })
  const { refetch: refetchPools } = poolsQuery

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
  if (poolsEnabled && poolsQuery.isSuccess && poolsQuery.isFetchedAfterMount && poolsQuery.rawPoolCount !== undefined) {
    // An empty filtered response means no pool; cached data alone is not enough.
    return { poolState: { status: 'success', poolCount: poolsQuery.rawPoolCount }, refetch }
  }
  return { poolState: { status: 'loading' }, refetch }
}
