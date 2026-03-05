import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import { type DataApiPool, type ListTopPoolsResponse, ProtocolVersion, TopPoolsOrderBy } from '@universe/api'
import { useMemo } from 'react'
import { DEFAULT_TICK_SPACING } from 'uniswap/src/constants/pools'
import { dataApiQueries } from 'uniswap/src/data/apiClients/dataApiService/dataApiQueries'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import {
  calculate1DVolOverTvl,
  calculateApr,
  PoolSortFields,
  PoolTableSortState,
} from '~/appGraphql/data/pools/useTopPools'
import { OrderDirection } from '~/appGraphql/data/util'
import { useExploreTablesFilterStore } from '~/pages/Explore/exploreTablesFilterStore'
import { EXPLORE_API_PAGE_SIZE } from '~/state/explore/constants'
import { useInfiniteLoadMore } from '~/state/explore/hooks/useInfiniteLoadMore'
import { PoolStat } from '~/state/explore/types'

/**
 * Converts numeric ProtocolVersion enum to display string (v2, v3, v4)
 */
function protocolVersionToDisplayString(version: ProtocolVersion): string | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return 'v2'
    case ProtocolVersion.V3:
      return 'v3'
    case ProtocolVersion.V4:
      return 'v4'
    default:
      return undefined
  }
}

/**
 * Maps PoolSortFields to TopPoolsOrderBy for backend sorting.
 * Note: VolOverTvl is not supported by the backend, so we apply client-side sorting.
 */
const poolSortFieldToOrderBy: Partial<Record<PoolSortFields, TopPoolsOrderBy>> = {
  [PoolSortFields.TVL]: TopPoolsOrderBy.TVL,
  [PoolSortFields.Volume24h]: TopPoolsOrderBy.VOLUME_1D,
  [PoolSortFields.Volume30D]: TopPoolsOrderBy.VOLUME_30D,
  [PoolSortFields.Apr]: TopPoolsOrderBy.APR,
  [PoolSortFields.RewardApr]: TopPoolsOrderBy.REWARD_APR,
  // VolOverTvl is intentionally omitted - sorted client-side
}

/**
 * Converts DataApiPool to PoolStat for compatibility with existing UI
 */
function convertDataApiPoolToPoolStat(pool: DataApiPool): PoolStat {
  const feeTierValue = pool.feeTier
  const chainName = toGraphQLChain(pool.chainId as UniverseChainId)

  return {
    id: pool.poolId,
    chain: chainName,
    protocolVersion: protocolVersionToDisplayString(pool.protocolVersion),
    token0: pool.token0
      ? {
          chain: toGraphQLChain(pool.token0.chainId as UniverseChainId),
          address: pool.token0.address,
          symbol: pool.token0.symbol,
          name: pool.token0.name,
          decimals: pool.token0.decimals,
          logo: pool.token0.metadata?.logoUrl,
        }
      : undefined,
    token1: pool.token1
      ? {
          chain: toGraphQLChain(pool.token1.chainId as UniverseChainId),
          address: pool.token1.address,
          symbol: pool.token1.symbol,
          name: pool.token1.name,
          decimals: pool.token1.decimals,
          logo: pool.token1.metadata?.logoUrl,
        }
      : undefined,
    totalLiquidity: pool.stats?.tvl !== undefined ? { value: pool.stats.tvl } : undefined,
    volume1Day: pool.stats?.volume1d !== undefined ? { value: pool.stats.volume1d } : undefined,
    volume30Day: pool.stats?.volume30d !== undefined ? { value: pool.stats.volume30d } : undefined,
    apr: calculateApr({
      volume24h: pool.stats?.volume1d,
      tvl: pool.stats?.tvl,
      feeTier: feeTierValue,
    }),
    boostedApr: pool.stats?.rewardApr,
    feeTier: {
      feeAmount: feeTierValue,
      tickSpacing: DEFAULT_TICK_SPACING,
      isDynamic: pool.isDynamicFee,
    },
    volOverTvl: calculate1DVolOverTvl(pool.stats?.volume1d, pool.stats?.tvl),
    hookAddress: pool.hookAddress,
  } as PoolStat
}

/**
 * Client-side sorting for VolOverTvl (not supported by backend)
 */
function sortPoolsByVolOverTvl(pools: PoolStat[], ascending: boolean): PoolStat[] {
  return [...pools].sort((a, b) => {
    const diff = (b.volOverTvl ?? 0) - (a.volOverTvl ?? 0)
    return ascending ? -diff : diff
  })
}

/**
 * Hook that uses the new ListTopPools endpoint with backend filtering/sorting.
 * @param sortState - Sort configuration
 * @param chainId - Optional chain ID to filter pools
 * @param protocol - Optional protocol version filter
 * @param enabled - Whether the query should be enabled (default: true)
 */
export function useBackendSortedTopPools({
  sortState,
  chainId,
  protocol,
  enabled,
}: {
  sortState: PoolTableSortState
  chainId?: UniverseChainId
  protocol?: ProtocolVersion
  enabled?: boolean
}): {
  topPools: PoolStat[] | undefined
  topBoostedPools: PoolStat[] | undefined
  isLoading: boolean
  isError: boolean
  loadMore: ({ onComplete }: { onComplete?: () => void }) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
} {
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const enabledChains = useEnabledChains()

  // VolOverTvl sorting is done client-side since it's not supported by the backend
  const isVolOverTvlSorting = sortState.sortBy === PoolSortFields.VolOverTvl

  // Always pass an orderBy to the backend - default to TVL for unsupported sort fields
  const orderBy = poolSortFieldToOrderBy[sortState.sortBy] ?? TopPoolsOrderBy.TVL
  const ascending = sortState.sortDirection === OrderDirection.Asc

  // When no protocol filter is selected, include all protocol versions
  // Note: protocol === 0 is ProtocolVersion.UNSPECIFIED, treat as "all"
  const protocolVersions =
    protocol !== undefined && protocol !== 0 ? [protocol] : [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4]

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    dataApiQueries.listTopPools({
      params: {
        chainIds: chainId ? [chainId] : enabledChains.chains,
        protocolVersions,
        orderBy,
        ascending,
        pageSize: EXPLORE_API_PAGE_SIZE,
      },
      enabled,
    }),
  )

  const infiniteData = data as InfiniteData<ListTopPoolsResponse> | undefined
  const allPools = useMemo(
    () => infiniteData?.pages.flatMap((page: ListTopPoolsResponse) => page.pools),
    [infiniteData?.pages],
  )

  // Convert pools to PoolStat format and apply client-side sorting for volOverTvl
  const { sortedPoolStats, boostedPoolStats } = useMemo(() => {
    let converted = allPools?.map((pool: DataApiPool) => convertDataApiPoolToPoolStat(pool))

    if (!converted) {
      return { sortedPoolStats: undefined, boostedPoolStats: undefined }
    }

    // Apply client-side sorting only for volOverTvl (not supported by backend)
    if (isVolOverTvlSorting) {
      converted = sortPoolsByVolOverTvl(converted, ascending)
    }

    const boosted = converted
      .filter((pool: PoolStat) => typeof pool.boostedApr === 'number' && pool.boostedApr > 0)
      .sort((a: PoolStat, b: PoolStat) => (b.boostedApr ?? 0) - (a.boostedApr ?? 0))

    return { sortedPoolStats: converted, boostedPoolStats: boosted }
  }, [allPools, isVolOverTvlSorting, ascending])

  // Client-side filtering for search
  const filteredPoolStats = useMemo(() => {
    if (!sortedPoolStats) {
      return undefined
    }
    if (!filterString) {
      return sortedPoolStats
    }
    const lowercaseFilter = filterString.toLowerCase()
    return sortedPoolStats.filter((pool: PoolStat) => {
      const addressIncludesFilterString = pool.id.toLowerCase().includes(lowercaseFilter)
      const token0IncludesFilterString = pool.token0?.symbol?.toLowerCase().includes(lowercaseFilter)
      const token1IncludesFilterString = pool.token1?.symbol?.toLowerCase().includes(lowercaseFilter)
      const token0HashIncludesFilterString = pool.token0?.address
        ? normalizeTokenAddressForCache(pool.token0.address).includes(lowercaseFilter)
        : false
      const token1HashIncludesFilterString = pool.token1?.address
        ? normalizeTokenAddressForCache(pool.token1.address).includes(lowercaseFilter)
        : false
      const poolName = `${pool.token0?.symbol}/${pool.token1?.symbol}`.toLowerCase()
      const poolNameIncludesFilterString = poolName.includes(lowercaseFilter)
      return (
        token0IncludesFilterString ||
        token1IncludesFilterString ||
        addressIncludesFilterString ||
        token0HashIncludesFilterString ||
        token1HashIncludesFilterString ||
        poolNameIncludesFilterString
      )
    })
  }, [sortedPoolStats, filterString])

  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    dataLength: filteredPoolStats?.length ?? 0,
  })

  return {
    topPools: filteredPoolStats,
    topBoostedPools: boostedPoolStats,
    isLoading,
    isError: !!error,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
  }
}
