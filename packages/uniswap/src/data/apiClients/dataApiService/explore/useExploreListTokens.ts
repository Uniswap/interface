import { ConnectError } from '@connectrpc/connect'
import { useInfiniteQuery } from '@tanstack/react-query'
import { RankedMultichainToken, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { getExploreListTokensInfiniteQueryOptions } from '@universe/data-api'
import { useMemo } from 'react'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'

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
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    getExploreListTokensInfiniteQueryOptions(dataApiServiceClientV2, {
      chainIds,
      orderBy,
      ascending,
      pageSize,
      categoryId,
      enabled,
    }),
  )

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
