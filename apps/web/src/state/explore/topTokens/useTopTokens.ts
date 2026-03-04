import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { useBackendSortedTopTokens } from '~/state/explore/topTokens/useBackendSortedTopTokens'
import { useTopTokensLegacy } from '~/state/explore/topTokens/useTopTokensLegacy'
import { useExploreBackendSortingEnabled } from '~/state/explore/useExploreBackendSortingEnabled'
import { useExploreQueryLatencyTracking } from '~/state/explore/useExploreQueryLatencyTracking'

type UseTopTokensSortOptions = {
  sortMethod: TokenSortMethod
  sortAscending: boolean
}

/**
 * Hook that returns top tokens data.
 * Uses the new ListTopTokens endpoint with backend sorting when ExplorePaginationImprovements is enabled,
 * otherwise falls back to the legacy ExploreContext implementation.
 * @param chainId - Optional chain ID to filter tokens
 * @param sortOptions - Sort method and direction. Pass from TokenTableSortStore on Explore table, or fixed values e.g. on TDP carousel.
 */
export function useTopTokens(chainId: UniverseChainId | undefined, sortOptions?: UseTopTokensSortOptions) {
  const isExploreBackendSortingEnabled = useExploreBackendSortingEnabled()

  // Legacy uses ExploreContext - skip processing when new endpoint is enabled
  const legacyResult = useTopTokensLegacy({
    enabled: !isExploreBackendSortingEnabled,
    sortMethod: sortOptions?.sortMethod ?? TokenSortMethod.VOLUME,
    sortAscending: sortOptions?.sortAscending ?? false,
  })
  // Only fetch from new endpoint when feature flag is enabled
  const backendSortedResult = useBackendSortedTopTokens({
    chainId,
    enabled: isExploreBackendSortingEnabled,
    sortMethod: sortOptions?.sortMethod ?? TokenSortMethod.VOLUME,
    sortAscending: sortOptions?.sortAscending ?? false,
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
