import { type InfiniteData, useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ListTokenGroupsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { type TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { getListTokenGroupsInfiniteQueryOptions } from '@universe/data-api'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

/**
 * v2 ListTokenGroups: ranked groupings (all issuers' tokenizations of one underlying) for a grouped
 * category such as stocks/etfs/commodities. Replaces the v1 ListRankedRwas source on Explore.
 */
export function useListTokenGroupsQuery({
  categoryId,
  chainIds,
  orderBy,
  ascending = false,
  searchQuery,
  enabled = true,
}: {
  categoryId: string | undefined
  chainIds: number[]
  orderBy: TokensOrderBy
  ascending?: boolean
  /**
   * Server-side search over the category's groups (name, ticker, member name or symbol; a `0x` query matches
   * member addresses). Callers drop blank input so an empty search box shares the unsearched query.
   */
  searchQuery?: string
  enabled?: boolean
}): UseInfiniteQueryResult<InfiniteData<ListTokenGroupsResponse>> {
  const { chains: enabledChainIds } = useEnabledChains()
  const resolvedChainIds = chainIds.length > 0 ? chainIds : enabledChainIds

  return useInfiniteQuery(
    getListTokenGroupsInfiniteQueryOptions(dataApiServiceClientV2, {
      categoryId,
      chainIds: resolvedChainIds,
      orderBy,
      ascending,
      searchQuery,
      enabled,
    }),
  )
}
