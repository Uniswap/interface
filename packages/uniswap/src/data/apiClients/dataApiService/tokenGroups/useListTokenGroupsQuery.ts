import {
  type InfiniteData,
  keepPreviousData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import type { ListTokenGroupsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, type TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const TOKEN_GROUPS_PAGE_SIZE = 100

/**
 * v2 ListTokenGroups: ranked groupings (all issuers' tokenizations of one underlying) for a grouped
 * category such as stocks/etfs/commodities. Replaces the v1 ListRankedRwas source on Explore.
 */
export function useListTokenGroupsQuery({
  categoryId,
  chainIds,
  orderBy,
  ascending = false,
  enabled = true,
}: {
  categoryId: string | undefined
  chainIds: number[]
  orderBy: TokensOrderBy
  ascending?: boolean
  enabled?: boolean
}): UseInfiniteQueryResult<InfiniteData<ListTokenGroupsResponse>> {
  const { chains: enabledChainIds } = useEnabledChains()
  const resolvedChainIds = chainIds.length > 0 ? chainIds : enabledChainIds

  return useInfiniteQuery({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listTokenGroups', categoryId, resolvedChainIds, orderBy, ascending],
    queryFn: ({ pageParam }) =>
      dataApiServiceClientV2.listTokenGroups({
        chainIds: resolvedChainIds,
        filter: { categoryIds: categoryId ? [categoryId] : [] },
        sort: { orderBy, ascending },
        page: { pageSize: TOKEN_GROUPS_PAGE_SIZE, pageToken: pageParam },
        sparklineDuration: HistoryDuration.DAY,
      }),
    getNextPageParam: (lastPage: ListTokenGroupsResponse) => lastPage.page?.nextPageToken || undefined,
    initialPageParam: '',
    enabled: enabled && Boolean(categoryId) && resolvedChainIds.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * ONE_MINUTE_MS,
    gcTime: 30 * ONE_MINUTE_MS,
    retry: 2,
  })
}
