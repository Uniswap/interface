import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PoolTableSortState } from '~/appGraphql/data/pools/useTopPools'
import { useExploreContextTopPools } from '~/features/Explore/state/topPools'
import { useBackendSortedTopPools } from '~/features/Explore/state/topPools/useBackendSortedTopPools'
import { useExploreQueryLatencyTracking } from '~/features/Explore/state/useExploreQueryLatencyTracking'

/**
 * Hook that returns top pools data.
 * Uses the new ListTopPools endpoint with backend sorting when the pools V2 endpoints are enabled,
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
  const isV2ExplorePoolsEnabled = useFeatureFlag(FeatureFlags.V2EndpointsPools)

  // Legacy uses ExploreContext - skip processing when new endpoint is enabled
  const legacyResult = useExploreContextTopPools({ sortState, protocol, enabled: !isV2ExplorePoolsEnabled })

  // Only fetch from new endpoint when feature flag is enabled
  const backendSortedResult = useBackendSortedTopPools({
    sortState,
    chainId,
    protocol,
    enabled: isV2ExplorePoolsEnabled,
  })

  const result = isV2ExplorePoolsEnabled
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
    isBackendSortingEnabled: isV2ExplorePoolsEnabled,
    isLoading: result.isLoading,
    resultCount: result.topPools?.length,
    chainId,
  })

  return result
}
