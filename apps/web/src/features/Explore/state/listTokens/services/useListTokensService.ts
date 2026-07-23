import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { dataApiServiceClient, type ListTokensParams } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { EXPLORE_API_PAGE_SIZE } from '~/features/Explore/state/constants'
import { useInfiniteLoadMore } from '~/features/Explore/state/hooks/useInfiniteLoadMore'
import { createListTokensService } from '~/features/Explore/state/listTokens/services/listTokensService'
import {
  getEffectiveListTokensOptions,
  type UseListTokensOptions,
  type UseListTokensServiceResult,
} from '~/features/Explore/state/listTokens/types'
import { useTopTokensLegacy } from '~/features/Explore/state/listTokens/useTopTokensLegacy'
import { processMultichainTokensForDisplay } from '~/features/Explore/state/listTokens/utils/processMultichainTokensForDisplay'

/**
 * Runs both legacy (useTopTokensLegacy) and backend (infinite query) data paths and returns
 * a unified result. Loading and error state are symmetric: both come from this hook.
 *
 * @param chainId - Optional chain ID to filter tokens
 * @param options - Optional list options; defaults from getEffectiveListTokensOptions.
 */
export function useListTokensService(
  chainId: UniverseChainId | undefined,
  options?: UseListTokensOptions,
): UseListTokensServiceResult {
  const effectiveOptions = getEffectiveListTokensOptions(options)
  const { chains: enabledChainIds } = useEnabledChains()
  const tokensV2EndpointsEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)

  const chainIds = useMemo(() => (chainId !== undefined ? [chainId] : enabledChainIds), [chainId, enabledChainIds])

  // Stable keys so pagination/query state is preserved and we avoid refetches on load-state changes
  const optionsKeySegment = useMemo(
    () =>
      [
        effectiveOptions.sortMethod,
        effectiveOptions.sortAscending,
        effectiveOptions.filterString,
        effectiveOptions.filterTimePeriod,
      ] as const,
    [
      effectiveOptions.sortMethod,
      effectiveOptions.sortAscending,
      effectiveOptions.filterString,
      effectiveOptions.filterTimePeriod,
    ],
  )
  const listTokensQueryKey = useMemo(
    () => [ReactQueryCacheKey.TopTokens, chainIds, ...optionsKeySegment, tokensV2EndpointsEnabled] as const,
    [chainIds, optionsKeySegment, tokensV2EndpointsEnabled],
  )
  const legacyQueryKey = useMemo(
    () => [ReactQueryCacheKey.TopTokens, 'legacy', { multichain: true }, chainIds, ...optionsKeySegment] as const,
    [chainIds, optionsKeySegment],
  )

  const legacyResult = useTopTokensLegacy({
    enabled: !tokensV2EndpointsEnabled,
    options: effectiveOptions,
    multichain: true,
  })
  const getTokenStats = useEvent(() => legacyResult.topTokens)

  const getSourceType = useEvent((): 'legacy' | 'backend_sorted' => {
    return tokensV2EndpointsEnabled ? 'backend_sorted' : 'legacy'
  })

  const listTokens = useEvent((params: ListTokensParams) => dataApiServiceClient.listTokens(params))

  const service = useMemo(
    () =>
      createListTokensService({
        getSourceType,
        getTokenStats,
        listTokens,
      }),
    [getSourceType, getTokenStats, listTokens],
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
      service.getListTokens({
        chainIds,
        options: effectiveOptions,
        pageSize: EXPLORE_API_PAGE_SIZE,
        pageToken: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    initialPageParam: '',
    enabled: tokensV2EndpointsEnabled,
  })

  const {
    data: legacyData,
    isLoading: isLegacyQueryLoading,
    isError: isLegacyQueryError,
  } = useQuery({
    queryKey: legacyQueryKey,
    queryFn: () =>
      service.getListTokens({
        chainIds,
        options: effectiveOptions,
        pageSize: EXPLORE_API_PAGE_SIZE,
        pageToken: '',
      }),
    enabled: !tokensV2EndpointsEnabled && !legacyResult.isLoading,
  })

  const { topTokens, tokenSortRank } = useMemo(() => {
    const flat = tokensV2EndpointsEnabled
      ? (data?.pages ?? []).flatMap((p) => p.multichainTokens)
      : (legacyData?.multichainTokens ?? [])
    return processMultichainTokensForDisplay(flat, effectiveOptions)
  }, [tokensV2EndpointsEnabled, data?.pages, effectiveOptions, legacyData?.multichainTokens])

  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    dataLength: topTokens.length,
  })

  const legacyPathLoading = legacyResult.isLoading
  const legacyPathError = legacyResult.isError
  const isLoading = tokensV2EndpointsEnabled ? isBackendLoading : legacyPathLoading || isLegacyQueryLoading
  const isError = tokensV2EndpointsEnabled ? !!backendError : !!legacyPathError || isLegacyQueryError

  return {
    topTokens,
    tokenSortRank,
    isLoading,
    isError,
    loadMore: tokensV2EndpointsEnabled ? loadMore : undefined,
    hasNextPage: tokensV2EndpointsEnabled ? hasNextPage : false,
    isFetchingNextPage: tokensV2EndpointsEnabled ? isFetchingNextPage : false,
  }
}
