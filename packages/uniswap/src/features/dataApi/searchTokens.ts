import { SearchTokensResponse, SearchType } from '@uniswap/client-search/dist/search/v1/api_pb'
import { useMemo } from 'react'
import { searchTokenToCurrencyInfo, useSearchTokensAndPoolsQuery } from 'uniswap/src/data/rest/searchTokensAndPools'
import { GqlResult } from 'uniswap/src/data/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'
import { useEvent } from 'utilities/src/react/hooks'

export function useSearchTokens({
  searchQuery,
  chainFilter,
  skip,
  size = NUMBER_OF_RESULTS_LONG,
}: {
  searchQuery: string | null
  chainFilter: UniverseChainId | null
  skip: boolean
  size?: number
}): GqlResult<CurrencyInfo[]> {
  const { chains: enabledChainIds } = useEnabledChains()

  const variables = useMemo(
    () => ({
      searchQuery: searchQuery ?? undefined,
      chainIds: chainFilter ? [chainFilter] : enabledChainIds,
      searchType: SearchType.TOKEN,
      page: 1,
      size,
    }),
    [searchQuery, chainFilter, size, enabledChainIds],
  )

  const tokenSelect = useEvent((data: SearchTokensResponse): CurrencyInfo[] => {
    return data.tokens.map((token) => searchTokenToCurrencyInfo(token)).filter((c): c is CurrencyInfo => Boolean(c))
  })

  const {
    data: tokens,
    error,
    isPending,
    refetch,
  } = useSearchTokensAndPoolsQuery<CurrencyInfo[]>({
    input: variables,
    enabled: !skip,
    select: tokenSelect,
  })

  return useMemo(
    () => ({ data: tokens, loading: isPending, error: error ?? undefined, refetch }),
    [tokens, isPending, error, refetch],
  )
}
