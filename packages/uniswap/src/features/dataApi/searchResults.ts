import type { ConnectError } from '@connectrpc/connect'
import type { UseQueryResult } from '@tanstack/react-query'
import { SearchResponse, SearchType } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { rankedPoolToPoolSearchResult, useSearchQuery } from 'uniswap/src/data/apiClients/dataApiService/search/search'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { SearchAuctionResult } from 'uniswap/src/features/dataApi/searchAuctions'
import { toMultichainSearchResults } from 'uniswap/src/features/dataApi/searchTokens'
import type { MultichainSearchResult, PoolSearchResult } from 'uniswap/src/features/dataApi/types'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'
import { useEvent } from 'utilities/src/react/hooks'

export type SearchResults = {
  tokens: MultichainSearchResult[]
  pools: PoolSearchResult[]
  auctions: SearchAuctionResult[]
  categoryIds: string[]
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
  }
}

/** One SearchService request for every type in `types`; wallet search stays in `useWalletSearchResults`. */
export function useSearchResults({
  searchQuery,
  chainFilter,
  types,
  skip,
  size = NUMBER_OF_RESULTS_LONG,
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
