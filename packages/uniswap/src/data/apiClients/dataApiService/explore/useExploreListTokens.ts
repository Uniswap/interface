import { ConnectError } from '@connectrpc/connect'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, RankedMultichainToken, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useMemo } from 'react'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

/** Page size Explore requests from v2 ListTokens; shared so other all-networks consumers dedupe onto the same query. */
export const EXPLORE_LIST_TOKENS_PAGE_SIZE = 100

export interface UseExploreListTokensParams {
  chainIds: number[]
  orderBy: TokensOrderBy
  ascending: boolean
  pageSize: number
  categoryId?: string
  enabled?: boolean
}

export interface ExploreListTokensResult {
  multichainTokens: RankedMultichainToken[]
  /** True once the first page has resolved at least once, even if it came back empty. */
  hasData: boolean
  isLoading: boolean
  error: ConnectError | null
  refetch: () => void
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
}

/**
 * Wrapper around v2 ListTokens for Explore-style token lists. Unlike TokenRankings, v2 is
 * single-sort and paginated: the query key includes orderBy/ascending so sort changes trigger a
 * fresh fetch, and callers page forward via fetchNextPage rather than getting every sort order
 * back in one response.
 */
export function useExploreListTokens({
  chainIds,
  orderBy,
  ascending,
  pageSize,
  categoryId,
  enabled = true,
}: UseExploreListTokensParams): ExploreListTokensResult {
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [ReactQueryCacheKey.TopTokens, 'v2', chainIds, orderBy, ascending, pageSize, categoryId] as const,
    queryFn: ({ pageParam }) =>
      dataApiServiceClientV2.listTokens({
        chainIds,
        page: { pageSize, pageToken: pageParam },
        sort: { orderBy, ascending },
        // Required by BE — UNSPECIFIED is rejected, mirrors apps/web's getListTokens.ts.
        sparklineDuration: HistoryDuration.DAY,
        ...(categoryId !== undefined && { filter: { categoryIds: [categoryId] } }),
      }),
    getNextPageParam: (lastPage: ListTokensResponse) => lastPage.page?.nextPageToken || undefined,
    initialPageParam: '',
    staleTime: ONE_MINUTE_MS,
    // The global retry policy only covers FetchError 500s, which a ConnectRPC error never is —
    // without this, one failed request drops the token list into its error state.
    retry: 2,
    enabled,
  })

  const multichainTokens = useMemo(() => (data?.pages ?? []).flatMap((page) => page.multichainTokens), [data?.pages])

  return {
    multichainTokens,
    hasData: data !== undefined,
    isLoading,
    error: (error as ConnectError | null) ?? null,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  }
}
