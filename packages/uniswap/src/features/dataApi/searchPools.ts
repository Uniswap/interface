import { Pool, SearchTokensResponse, SearchType } from '@uniswap/client-search/dist/search/v1/api_pb'
import { useMemo } from 'react'
import { searchPoolToPoolSearchResult, useSearchTokensAndPoolsQuery } from 'uniswap/src/data/rest/searchTokensAndPools'
import { GqlResult } from 'uniswap/src/data/types'
import { SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'
import { PoolSearchResult } from 'uniswap/src/features/search/SearchResult'
import { useEvent } from 'utilities/src/react/hooks'

export function useSearchPools({
  searchQuery,
  chainFilter,
  skip,
  size = NUMBER_OF_RESULTS_LONG,
}: {
  searchQuery: string | null
  chainFilter: UniverseChainId | null
  skip: boolean
  size?: number
}): GqlResult<PoolSearchResult[]> {
  const variables = useMemo(
    () => ({
      searchQuery: searchQuery ?? undefined,
      chainIds: chainFilter ? [chainFilter] : SUPPORTED_CHAIN_IDS,
      searchType: SearchType.POOL,
      page: 1,
      size,
    }),
    [searchQuery, chainFilter, size],
  )

  const poolSelect = useEvent((response: SearchTokensResponse): PoolSearchResult[] => {
    const responsePools: Pool[] = response.pools
    return responsePools
      .map(searchPoolToPoolSearchResult)
      .filter((pool): pool is PoolSearchResult => pool !== undefined)
  })

  const {
    data: pools,
    error,
    isPending,
    refetch,
  } = useSearchTokensAndPoolsQuery<PoolSearchResult[]>({
    input: variables,
    enabled: !skip,
    select: poolSelect,
  })

  return useMemo(
    () => ({ data: pools, loading: isPending, error: error ?? undefined, refetch }),
    [pools, isPending, error, refetch],
  )
}
