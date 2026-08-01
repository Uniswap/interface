import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useListTokensService } from '~/features/Explore/state/listTokens/services/useListTokensService'
import { type UseListTokensOptions, type UseListTokensResult } from '~/features/Explore/state/listTokens/types'
import { buildSparklinesFromMultichain } from '~/features/Explore/state/listTokens/utils/buildSparklinesFromMultichain'
import { useExploreQueryLatencyTracking } from '~/features/Explore/state/useExploreQueryLatencyTracking'

/**
 * Hook that returns top tokens data for the Explore page. Delegates to useListTokensService
 * for data, loading, pagination, and tokenSortRank; adds explore-specific sparklines and latency tracking.
 *
 * @param chainId - Optional chain ID to filter tokens
 * @param options - Optional flat options: sortMethod, sortAscending, filterString, filterTimePeriod (from TokenTableSortStore on Explore; when provided, used instead of Explore filter store). Callers should pass a stable reference (e.g. memoized) to avoid unnecessary refetches.
 */
export function useListTokens(
  chainId: UniverseChainId | undefined,
  options?: UseListTokensOptions,
): UseListTokensResult {
  const tokensV2EndpointsEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const result = useListTokensService(chainId, options)

  const sparklines = useMemo(
    () => buildSparklinesFromMultichain(result.topTokens, result.priceHistoryByMultichainId),
    [result.topTokens, result.priceHistoryByMultichainId],
  )

  useExploreQueryLatencyTracking({
    queryType: 'tokens',
    isBackendSortingEnabled: tokensV2EndpointsEnabled,
    isLoading: result.isLoading,
    resultCount: result.topTokens.length,
    chainId,
  })

  return {
    ...result,
    sparklines,
  }
}
