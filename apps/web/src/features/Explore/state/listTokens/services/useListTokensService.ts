import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { dataApiServiceClient, type ListTokensParams } from 'uniswap/src/data/apiClients/dataApiService/listTokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'
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
import { useExploreBackendSortingEnabled } from '~/features/Explore/state/useExploreBackendSortingEnabled'

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
  const backendSorting = useExploreBackendSortingEnabled()

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
    () => ['topTokens', chainIds, ...optionsKeySegment, backendSorting] as const,
    [chainIds, optionsKeySegment, backendSorting],
  )
  const legacyQueryKey = useMemo(
    () => ['topTokens', 'legacy', { multichain: true }, chainIds, ...optionsKeySegment] as const,
    [chainIds, optionsKeySegment],
  )

  const legacyResult = useTopTokensLegacy({
    enabled: !backendSorting,
    options: effectiveOptions,
    multichain: true,
  })
  const getTokenStats = useEvent(() => legacyResult.topTokens)

  const getSourceType = useEvent((): 'legacy' | 'backend_sorted' => {
    return backendSorting ? 'backend_sorted' : 'legacy'
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
    enabled: backendSorting,
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
    enabled: !backendSorting && !legacyResult.isLoading,
  })

  const { topTokens, tokenSortRank } = useMemo(() => {
    const flat = backendSorting
      ? (data?.pages ?? []).flatMap((p) => p.multichainTokens)
      : (legacyData?.multichainTokens ?? [])
    return processMultichainTokensForDisplay(flat, effectiveOptions)
  }, [backendSorting, data?.pages, effectiveOptions, legacyData?.multichainTokens])

  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    dataLength: topTokens.length,
  })

  const legacyPathLoading = legacyResult.isLoading
  const legacyPathError = legacyResult.isError
  const isLoading = backendSorting ? isBackendLoading : legacyPathLoading || isLegacyQueryLoading
  const isError = backendSorting ? !!backendError : !!legacyPathError || isLegacyQueryError

  return {
    topTokens,
    tokenSortRank,
    isLoading,
    isError,
    loadMore: backendSorting ? loadMore : undefined,
    hasNextPage: backendSorting ? hasNextPage : false,
    isFetchingNextPage: backendSorting ? isFetchingNextPage : false,
  }
}
