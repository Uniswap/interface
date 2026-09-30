import { useInfiniteQuery } from '@tanstack/react-query'
import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { PricePoint } from '~/data/util'
import { EXPLORE_API_PAGE_SIZE } from '~/features/Explore/state/constants'
import { getListTokens } from '~/features/Explore/state/listTokens/getListTokens'
import { type UseListTokensOptions, type UseListTokensResult } from '~/features/Explore/state/listTokens/types'
import { getEffectiveListTokensOptions } from '~/features/Explore/state/listTokens/types'
import { buildSparklinesFromMultichain } from '~/features/Explore/state/listTokens/utils/buildSparklinesFromMultichain'
import { processMultichainTokensForDisplay } from '~/features/Explore/state/listTokens/utils/processMultichainTokensForDisplay'
import { useExploreQueryLatencyTracking } from '~/features/Explore/state/useExploreQueryLatencyTracking'
import { toSearchQueryParam } from '~/features/Explore/utils/toSearchQueryParam'
import { useInfiniteLoadMore } from '~/hooks/useInfiniteLoadMore'

/**
 * Hook that returns top tokens data for the Explore page. Adds explore-specific sparklines and latency tracking.
 *
 * @param chainId - Optional chain ID to filter tokens
 * @param options - Optional flat options: sortMethod, sortAscending, filterString, filterTimePeriod (from TokenTableSortStore on Explore; when provided, used instead of Explore filter store). Callers should pass a stable reference (e.g. memoized) to avoid unnecessary refetches.
 */
export function useListTokens(
  chainId: UniverseChainId | undefined,
  options?: UseListTokensOptions,
): UseListTokensResult {
  const effectiveOptions = useMemo(() => getEffectiveListTokensOptions(options), [options])
  const { chains: enabledChainIds } = useEnabledChains()
  // Superset of enabledChainIds by construction: useEnabledChains derives its set FROM
  // useFeatureFlaggedChainIds (getEnabledChains drops chains outside it), and testnet chains are
  // never rollout-flag-gated, so every fetched chain passes the display filter in both testnet
  // states and the pipeline's empty-set hide can never blank a fetched row.
  const featureFlaggedChainIds = useFeatureFlaggedChainIds()

  const chainIds = useMemo(() => (chainId !== undefined ? [chainId] : enabledChainIds), [chainId, enabledChainIds])

  // Keyed on the normalized search the request will carry, so a blank or whitespace-only box shares
  // the unsearched entry instead of refetching.
  const backendOptionsKeySegment = useMemo(
    () =>
      [
        effectiveOptions.sortMethod,
        effectiveOptions.sortAscending,
        effectiveOptions.filterTimePeriod,
        effectiveOptions.categoryId,
        toSearchQueryParam(effectiveOptions.filterString),
      ] as const,
    [effectiveOptions],
  )
  const listTokensQueryKey = useMemo(
    () => [ReactQueryCacheKey.TopTokens, chainIds, ...backendOptionsKeySegment] as const,
    [chainIds, backendOptionsKeySegment],
  )

  const {
    data,
    isLoading: isBackendLoading,
    error: backendError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: listTokensQueryKey,
    queryFn: ({ pageParam }) =>
      getListTokens({
        chainIds,
        options: effectiveOptions,
        pageSize: EXPLORE_API_PAGE_SIZE,
        pageToken: pageParam,
      }),
    // An empty page ends the list even if it carries a token: the tokens feed has no budget-walk
    // resume cursor (unlike ListPools, whose empty page + token must be followed — see
    // getListPoolsInfiniteQueryOptions), so following one could only burn empty fetches.
    getNextPageParam: (lastPage) =>
      lastPage.multichainTokens.length ? lastPage.nextPageToken || undefined : undefined,
    initialPageParam: '',
    // The global retry policy only covers FetchError 500s, which a ConnectRPC error never is —
    // without this, one failed request drops the tokens table into its error state until the next
    // heartbeat tick (up to 60s away on Explore).
    retry: 2,
  })

  const { topTokens, tokenSortRank } = useMemo(() => {
    const flat = (data?.pages ?? []).flatMap((p) => p.multichainTokens)
    return processMultichainTokensForDisplay({ tokens: flat, allowedChainIds: featureFlaggedChainIds })
  }, [data?.pages, featureFlaggedChainIds])

  const priceHistoryByMultichainId = useMemo((): Partial<Record<string, PricePoint[]>> => {
    return (data?.pages ?? []).reduce<Partial<Record<string, PricePoint[]>>>(
      (acc, page) => ({ ...acc, ...page.priceHistoryByMultichainId }),
      {},
    )
  }, [data?.pages])

  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  })

  const isLoading = isBackendLoading
  const isError = !!backendError

  const sparklines = useMemo(
    () => buildSparklinesFromMultichain(topTokens, priceHistoryByMultichainId),
    [topTokens, priceHistoryByMultichainId],
  )

  useExploreQueryLatencyTracking({
    queryType: 'tokens',
    isLoading,
    resultCount: topTokens.length,
    chainId,
  })

  return {
    topTokens,
    tokenSortRank,
    sparklines,
    priceHistoryByMultichainId,
    isLoading,
    isError,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
  }
}
