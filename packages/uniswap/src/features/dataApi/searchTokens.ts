import { SearchTokensResponse, SearchType } from '@uniswap/client-search/dist/search/v1/api_pb'
import { GqlResult } from '@universe/api'
import { useMemo } from 'react'
import { searchTokenToCurrencyInfo, useSearchTokensAndPoolsQuery } from 'uniswap/src/data/rest/searchTokensAndPools'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'
import { isWSOL } from 'uniswap/src/utils/isWSOL'
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
    return data.tokens
      .map((token) => searchTokenToCurrencyInfo(token))
      .filter((c): c is CurrencyInfo => {
        if (!c) {
          return false
        }
        // Filter out WSOL from Solana search results
        if (isWSOL(c.currency)) {
          return false
        }
        return true
      })
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
