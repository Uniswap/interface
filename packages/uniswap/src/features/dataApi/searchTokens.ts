import type { ConnectError } from '@connectrpc/connect'
import type { UseQueryResult } from '@tanstack/react-query'
import { SearchResponse, SearchType } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { useSearchQuery } from 'uniswap/src/data/apiClients/dataApiService/search/search'
import { dataApiMultichainTokenToSearchResult } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { MultichainSearchResult } from 'uniswap/src/features/dataApi/types'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Converts the token buckets of a data.v2 SearchResponse into app-layer results.
 * Suppressed (lower-quality) tokens are appended after the default bucket per the Search V2 PRD's
 * infra-first milestone; the "see more" expando splits them out in a later UI milestone.
 */
export function toMultichainSearchResults({
  response,
  chainFilter,
  size,
}: {
  response: Pick<SearchResponse, 'tokens' | 'suppressedTokens'>
  chainFilter: UniverseChainId | null
  size: number
}): MultichainSearchResult[] {
  // maxResults caps each response bucket separately, so default + suppressed together can
  // exceed the caller's requested size — trim before converting.
  const results = [
    ...response.tokens.map((token) => ({ token, isSuppressed: false })),
    ...response.suppressedTokens.map((token) => ({ token, isSuppressed: true })),
  ]
    .slice(0, size)
    .map(({ token, isSuppressed }) => dataApiMultichainTokenToSearchResult(token, { isSuppressed }))
    .filter((r): r is MultichainSearchResult => r !== undefined)

  return filterMultichainResultsToChain(results, chainFilter)
}

/**
 * Token-only search for the token selector. The search modal fetches every result type in one
 * request via `useSearchResults` instead.
 * The request carries no prioritizeSvm hint — v2 SearchRequest has no equivalent field
 * and the omission is intentional (see the PRD).
 */
export function useMultichainSearchTokens({
  searchQuery,
  chainFilter,
  chainIds,
  skip,
  size = NUMBER_OF_RESULTS_LONG,
}: {
  searchQuery: string | null
  chainFilter: UniverseChainId | null
  chainIds?: UniverseChainId[]
  skip: boolean
  size?: number
}): UseQueryResult<MultichainSearchResult[], ConnectError> {
  const { chains: enabledChainIds } = useEnabledChains()

  const variables = useMemo(
    () => ({
      searchQuery: searchQuery ?? undefined,
      chainIds: chainFilter ? [chainFilter] : (chainIds ?? enabledChainIds),
      types: [SearchType.TOKEN],
      maxResults: size,
    }),
    [searchQuery, chainFilter, chainIds, size, enabledChainIds],
  )

  const select = useEvent((response: SearchResponse): MultichainSearchResult[] =>
    toMultichainSearchResults({ response, chainFilter, size }),
  )

  return useSearchQuery<MultichainSearchResult[]>({
    input: variables,
    enabled: !skip,
    select,
  })
}

export function filterMultichainResultsToChain(
  results: MultichainSearchResult[],
  chainFilter: UniverseChainId | null,
): MultichainSearchResult[] {
  if (!chainFilter) {
    return results
  }

  return results
    .map((result) => ({
      ...result,
      tokens: result.tokens.filter((token) => token.currency.chainId === chainFilter),
    }))
    .filter((result) => result.tokens.length > 0)
}
