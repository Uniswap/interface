import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useMemo } from 'react'
import { useListRankedRwasQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRankedRwas'
import { mapRankedRwaList } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRankedRwa'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { mapRankedTokenGroupList } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/mapRankedTokenGroup'
import { useListTokenGroupsQuery } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useListTokenGroupsQuery'
import type { VolumeOrderBy } from 'uniswap/src/data/apiClients/dataApiService/utils/tokenRankStatsVolume'
import { RWA_CATEGORY_IDS } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'
import { noop } from 'utilities/src/react/noop'

export interface ExploreRwaRowsResult {
  rows: Rwa[]
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<unknown>
  /** Paging is only available from the v2 source; v1 serves the whole list in one response. */
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  /** True when a `sort` was requested and the v2 source served `rows` in that order; v1 ignores `sort`. */
  isSortedByServer: boolean
}

export interface ExploreRwaRowsSort {
  orderBy: TokensOrderBy
  ascending: boolean
}

/**
 * Grouped rows for an Explore RWA category. Sourced from v2 ListTokenGroups when token categories
 * are on, otherwise from the v1 ListRankedRwas endpoint; both map onto the same `Rwa` row shape so
 * the tables don't know which served them.
 */
export function useExploreRwaRows({
  category,
  chainIds = [],
  volumeOrderBy,
  sort,
  enabled = true,
}: {
  category: RwaCategory
  chainIds?: number[]
  /** Volume window the v2 rows display; also the default ranking when no `sort` is given. */
  volumeOrderBy: VolumeOrderBy
  /** Server ranking for the v2 source, so paged rows arrive already ordered. */
  sort?: ExploreRwaRowsSort
  enabled?: boolean
}): ExploreRwaRowsResult {
  const isTokenGroupsSource = useIsTokenCategoriesEnabled()

  const groupsQuery = useListTokenGroupsQuery({
    categoryId: RWA_CATEGORY_IDS[category],
    chainIds,
    orderBy: sort?.orderBy ?? volumeOrderBy,
    ascending: sort?.ascending ?? false,
    enabled: enabled && isTokenGroupsSource,
  })
  const rankedRwasQuery = useListRankedRwasQuery({
    category,
    chainIds,
    includeSparkline1d: true,
    enabled: enabled && !isTokenGroupsSource,
  })

  const rows = useMemo(
    () =>
      isTokenGroupsSource
        ? (groupsQuery.data?.pages ?? []).flatMap((page) =>
            mapRankedTokenGroupList({ response: page, category, volumeOrderBy }),
          )
        : mapRankedRwaList({ response: rankedRwasQuery.data, category }),
    [isTokenGroupsSource, groupsQuery.data?.pages, rankedRwasQuery.data, category, volumeOrderBy],
  )

  if (isTokenGroupsSource) {
    const { isLoading, isPlaceholderData, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
      groupsQuery
    return {
      rows,
      // keepPreviousData serves the prior query's rows as a success; treat them as loading so a sort or
      // chain change shows the skeleton instead of the old order under the new header, as the All tab does.
      isLoading: isLoading || isPlaceholderData,
      isError,
      refetch,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isSortedByServer: sort !== undefined,
    }
  }

  const { isLoading, isError, refetch } = rankedRwasQuery
  return {
    rows,
    isLoading,
    isError,
    refetch,
    fetchNextPage: noop,
    hasNextPage: false,
    isFetchingNextPage: false,
    isSortedByServer: false,
  }
}
