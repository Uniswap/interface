import { Pool, SearchTokensResponse, SearchType } from '@uniswap/client-search/dist/search/v1/api_pb'
import { useMemo } from 'react'
import { searchPoolToPoolSearchResult, useSearchTokensAndPoolsQuery } from 'uniswap/src/data/rest/searchTokensAndPools'
import { GqlResult } from 'uniswap/src/data/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
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
  const { chains: enabledChainIds } = useEnabledChains({ platform: Platform.EVM })

  const variables = useMemo(
    () => ({
      searchQuery: searchQuery ?? undefined,
      chainIds: chainFilter ? [chainFilter] : enabledChainIds,
      searchType: SearchType.POOL,
      page: 1,
      size,
    }),
    [searchQuery, chainFilter, size, enabledChainIds],
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
