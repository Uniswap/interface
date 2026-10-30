import type { ConnectError } from '@connectrpc/connect'
import type { UseQueryResult } from '@tanstack/react-query'
import { SearchResponse, SearchType } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { rankedPoolToPoolSearchResult, useSearchQuery } from 'uniswap/src/data/apiClients/dataApiService/search/search'
import { mapRankedTokenGroup } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/mapRankedTokenGroup'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { SearchAuctionResult } from 'uniswap/src/features/dataApi/searchAuctions'
import { toMultichainSearchResults } from 'uniswap/src/features/dataApi/searchTokens'
import type { MultichainSearchResult, PoolSearchResult } from 'uniswap/src/features/dataApi/types'
import { NUMBER_OF_SEARCH_RESULTS } from 'uniswap/src/features/search/SearchModal/constants'
import { getRwaCategoryForCategoryId } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'
import { useEvent } from 'utilities/src/react/hooks'

export type SearchResults = {
  tokens: MultichainSearchResult[]
  pools: PoolSearchResult[]
  auctions: SearchAuctionResult[]
  categoryIds: string[]
  /** Stock / ETF groups the query matched, in the Explore grouped tables' row shape, volume-ordered by the server. */
  tokenGroups: Rwa[]
}

export function toSearchResults({
  response,
  chainFilter,
  size,
}: {
  response: SearchResponse
  chainFilter: UniverseChainId | null
  size: number
}): SearchResults {
  return {
    tokens: toMultichainSearchResults({ response, chainFilter, size }),
    pools: response.pools
      .map(rankedPoolToPoolSearchResult)
      .filter((pool): pool is PoolSearchResult => pool !== undefined),
    auctions: response.auctions,
    categoryIds: response.categoryIds,
    tokenGroups: response.tokenGroups.flatMap((rankedGroup) => {
      const rwa = mapRankedTokenGroup({
        rankedGroup,
        category: getRwaCategoryForCategoryId(rankedGroup.group?.categoryId ?? ''),
        volumeOrderBy: TokensOrderBy.VOLUME_1D,
      })
      return rwa ? [rwa] : []
    }),
  }
}

/** One SearchService request for every type in `types`; wallet search stays in `useWalletSearchResults`. */
export function useSearchResults({
  searchQuery,
  chainFilter,
  types,
  skip,
  size = NUMBER_OF_SEARCH_RESULTS,
}: {
  searchQuery: string | null
  chainFilter: UniverseChainId | null
  types: SearchType[]
  skip: boolean
  size?: number
}): UseQueryResult<SearchResults, ConnectError> {
  const { chains: enabledChainIds } = useEnabledChains()

  const input = useMemo(
    () => ({
      searchQuery: searchQuery ?? undefined,
      chainIds: chainFilter ? [chainFilter] : enabledChainIds,
      types,
      maxResults: size,
    }),
    [searchQuery, chainFilter, enabledChainIds, types, size],
  )

  const select = useEvent((response: SearchResponse): SearchResults => toSearchResults({ response, chainFilter, size }))

  return useSearchQuery<SearchResults>({
    input,
    enabled: !skip && types.length > 0,
    select,
  })
}
