import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PoolTableSortState } from '~/appGraphql/data/pools/useTopPools'
import { useExploreContextTopPools } from '~/state/explore/topPools'
import { useBackendSortedTopPools } from '~/state/explore/topPools/useBackendSortedTopPools'
import { useExploreBackendSortingEnabled } from '~/state/explore/useExploreBackendSortingEnabled'
import { useExploreQueryLatencyTracking } from '~/state/explore/useExploreQueryLatencyTracking'

/**
 * Hook that returns top pools data.
 * Uses the new ListTopPools endpoint with backend sorting when ExploreBackendSorting is enabled,
 * otherwise falls back to the legacy ExploreContext implementation.
 */
export function useTopPools({
  sortState,
  chainId,
  protocol,
}: {
  sortState: PoolTableSortState
  chainId?: UniverseChainId
  protocol?: ProtocolVersion
}): {
  topPools: ReturnType<typeof useExploreContextTopPools>['topPools']
  topBoostedPools: ReturnType<typeof useExploreContextTopPools>['topBoostedPools']
  isLoading: boolean
  isError: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
} {
  const isExploreBackendSortingEnabled = useExploreBackendSortingEnabled()

  // Legacy uses ExploreContext - skip processing when new endpoint is enabled
  const legacyResult = useExploreContextTopPools({ sortState, protocol, enabled: !isExploreBackendSortingEnabled })

  // Only fetch from new endpoint when feature flag is enabled
  const backendSortedResult = useBackendSortedTopPools({
    sortState,
    chainId,
    protocol,
    enabled: isExploreBackendSortingEnabled,
  })

  const result = isExploreBackendSortingEnabled
    ? backendSortedResult
    : {
        ...legacyResult,
        loadMore: undefined,
        hasNextPage: false,
        isFetchingNextPage: false,
      }

  // Track latency when data first loads (for both legacy and new implementations)
  useExploreQueryLatencyTracking({
    queryType: 'pools',
    isBackendSortingEnabled: isExploreBackendSortingEnabled,
    isLoading: result.isLoading,
    resultCount: result.topPools?.length,
    chainId,
  })

  return result
}
