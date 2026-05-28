import { SearchType } from '@uniswap/client-search/dist/search/v1/api_pb'
import { useMemo } from 'react'
import {
  searchTokenToCurrencyInfo,
  useSearchTokensQuery as useSearchTokensRestQuery,
} from 'uniswap/src/data/rest/searchTokens'
import { GqlResult } from 'uniswap/src/data/types'
import { SUPPORTED_CHAIN_IDS, UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'

export function useSearchTokensRest({
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
  const variables = useMemo(
    () => ({
      searchQuery: searchQuery ?? undefined,
      chainIds: chainFilter ? [chainFilter] : SUPPORTED_CHAIN_IDS,
      searchType: SearchType.TOKEN,
      page: 1,
      size,
    }),
    [searchQuery, chainFilter, size],
  )

  const { data, error, isPending, refetch } = useSearchTokensRestQuery({ input: variables, enabled: !skip })

  const formattedData = useMemo(() => {
    if (!data || !data.tokens) {
      return undefined
    }

    return data.tokens
      .map((token) => {
        return searchTokenToCurrencyInfo(token)
      })
      .filter((c): c is CurrencyInfo => Boolean(c))
  }, [data])

  return useMemo(
    () => ({ data: formattedData, loading: isPending, error: error ?? undefined, refetch }),
    [formattedData, isPending, error, refetch],
  )
}
