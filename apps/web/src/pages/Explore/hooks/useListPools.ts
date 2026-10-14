import { UniverseChainId } from '@universe/chains'
import { PoolTableSortState } from '~/data/pools/poolStats'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { useExploreQueryLatencyTracking } from '~/features/Explore/state/useExploreQueryLatencyTracking'
import { useV2ListPools } from '~/pages/Explore/hooks/useV2ListPools'
import type { PoolStat } from '~/types/explore'
import type { PoolsFilterState } from '~/types/poolsFilter'

/**
 * Explore's binding to the shared ranked-pools list: it supplies the search string from the tables
 * filter store (which the pool browser, holding its filters in URL params, has no part in) and
 * reports Explore's query latency.
 */
export function useListPools({
  sortState,
  chainId,
  poolsFilter,
}: {
  sortState: PoolTableSortState
  chainId?: UniverseChainId
  /** Advanced pools filter. */
  poolsFilter?: PoolsFilterState
}): {
  pools: PoolStat[] | undefined
  isLoading: boolean
  isError: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  /** The one chain the list is filtered to (URL chain or advanced filter); undefined for all networks. */
  chainId?: UniverseChainId
} {
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const result = useV2ListPools({ sortState, chainId, poolsFilter, filterString })

  useExploreQueryLatencyTracking({
    queryType: 'pools',
    isLoading: result.isLoading,
    resultCount: result.pools?.length,
    chainId,
  })

  return result
}
