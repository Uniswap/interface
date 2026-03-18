import { Pool, SearchTokensResponse, SearchType } from '@uniswap/client-search/dist/search/v1/api_pb'
import { GqlResult } from '@universe/api'
import { useMemo } from 'react'
import { searchPoolToPoolSearchResult, useSearchTokensAndPoolsQuery } from 'uniswap/src/data/rest/searchTokensAndPools'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { PoolSearchHistoryResult } from 'uniswap/src/features/search/SearchHistoryResult'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'
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
}): GqlResult<PoolSearchHistoryResult[]> {
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

  const poolSelect = useEvent((response: SearchTokensResponse): PoolSearchHistoryResult[] => {
    const responsePools: Pool[] = response.pools
    return responsePools
      .map(searchPoolToPoolSearchResult)
      .filter((pool): pool is PoolSearchHistoryResult => pool !== undefined)
  })

  const {
    data: pools,
    error,
    isPending,
    refetch,
  } = useSearchTokensAndPoolsQuery<PoolSearchHistoryResult[]>({
    input: variables,
    enabled: !skip,
    select: poolSelect,
  })

  return useMemo(
    () => ({ data: pools, loading: isPending, error: error ?? undefined, refetch }),
    [pools, isPending, error, refetch],
  )
}
