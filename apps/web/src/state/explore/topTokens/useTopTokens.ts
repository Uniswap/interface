import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEffectiveTopTokensOptions, type UseTopTokensOptions } from '~/state/explore/topTokens/types'
import { useBackendSortedTopTokens } from '~/state/explore/topTokens/useBackendSortedTopTokens'
import { useTopTokensLegacy } from '~/state/explore/topTokens/useTopTokensLegacy'
import { useExploreBackendSortingEnabled } from '~/state/explore/useExploreBackendSortingEnabled'
import { useExploreQueryLatencyTracking } from '~/state/explore/useExploreQueryLatencyTracking'

/**
 * Hook that returns top tokens data.
 * Uses the new ListTopTokens endpoint with backend sorting when ExplorePaginationImprovements is enabled,
 * otherwise falls back to the legacy ExploreContext implementation.
 * @param chainId - Optional chain ID to filter tokens
 * @param options - Optional flat options: sortMethod, sortAscending, filterString, filterTimePeriod (from TokenTableSortStore on Explore; when provided, used instead of Explore filter store). Callers should pass a stable reference (e.g. memoized) to avoid unnecessary refetches.
 */
export function useTopTokens(chainId: UniverseChainId | undefined, options?: UseTopTokensOptions) {
  const isExploreBackendSortingEnabled = useExploreBackendSortingEnabled()
  const effectiveOptions = getEffectiveTopTokensOptions(options)

  // Legacy uses ExploreContext - skip processing when new endpoint is enabled
  const legacyResult = useTopTokensLegacy({
    enabled: !isExploreBackendSortingEnabled,
    options: effectiveOptions,
  })
  // Only fetch from new endpoint when feature flag is enabled
  const backendSortedResult = useBackendSortedTopTokens({
    chainId,
    enabled: isExploreBackendSortingEnabled,
    options: effectiveOptions,
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
    queryType: 'tokens',
    isBackendSortingEnabled: isExploreBackendSortingEnabled,
    isLoading: result.isLoading,
    resultCount: result.topTokens?.length,
    chainId,
  })

  return result
}
