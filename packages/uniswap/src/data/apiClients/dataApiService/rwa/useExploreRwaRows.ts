import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { VolumeOrderBy } from '@universe/data-api'
import { useMemo } from 'react'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { mapRankedTokenGroupList } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/mapRankedTokenGroup'
import { useListTokenGroupsQuery } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useListTokenGroupsQuery'
import { RWA_CATEGORY_IDS } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'

export interface ExploreRwaRowsResult {
  rows: Rwa[]
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<unknown>
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  /** True when a `sort` was requested, so `rows` arrive in that order. */
  isSortedByServer: boolean
}

export interface ExploreRwaRowsSort {
  orderBy: TokensOrderBy
  ascending: boolean
}

/** Grouped rows for an Explore RWA category, sourced from v2 ListTokenGroups and mapped onto the `Rwa` row shape. */
export function useExploreRwaRows({
  category,
  chainIds = [],
  volumeOrderBy,
  sort,
  searchQuery,
  enabled = true,
}: {
  category: RwaCategory
  chainIds?: number[]
  /** Volume window the rows display; also the default ranking when no `sort` is given. */
  volumeOrderBy: VolumeOrderBy
  /** Server ranking, so paged rows arrive already ordered. */
  sort?: ExploreRwaRowsSort
  /** Server search, already trimmed; undefined = unsearched. */
  searchQuery?: string
  enabled?: boolean
}): ExploreRwaRowsResult {
  const { data, isLoading, isPlaceholderData, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useListTokenGroupsQuery({
      categoryId: RWA_CATEGORY_IDS[category],
      chainIds,
      orderBy: sort?.orderBy ?? volumeOrderBy,
      ascending: sort?.ascending ?? false,
      searchQuery,
      enabled,
    })

  const rows = useMemo(
    () => (data?.pages ?? []).flatMap((page) => mapRankedTokenGroupList({ response: page, category, volumeOrderBy })),
    [data?.pages, category, volumeOrderBy],
  )

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
