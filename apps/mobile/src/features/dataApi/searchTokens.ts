import { useCallback, useMemo } from 'react'
import { ChainId } from 'wallet/src/constants/chains'
import { Chain, useSearchTokensQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { toGraphQLChain } from 'wallet/src/features/chains/utils'
import { CurrencyInfo, GqlResult } from 'wallet/src/features/dataApi/types'
import { gqlTokenToCurrencyInfo, usePersistedError } from 'wallet/src/features/dataApi/utils'

export const ALL_GQL_CHAINS = Object.values(Chain)

export function useSearchTokens(
  searchQuery: string | null,
  chainFilter: ChainId | null,
  skip: boolean
): GqlResult<CurrencyInfo[]> {
  const gqlChainFilter = chainFilter ? toGraphQLChain(chainFilter) : null
  const { data, loading, error, refetch } = useSearchTokensQuery({
    variables: {
      searchQuery: searchQuery ?? '',
      chains: gqlChainFilter ? [gqlChainFilter] : ALL_GQL_CHAINS,
    },
    skip,
  })

  const persistedError = usePersistedError(loading, error)

  const formattedData = useMemo(() => {
    if (!data || !data.searchTokens) {
      return
    }

    return data.searchTokens
      .map((token) => {
        if (!token) {
          return null
        }

        return gqlTokenToCurrencyInfo(token)
      })
      .filter((c): c is CurrencyInfo => Boolean(c))
  }, [data])

  const retry = useCallback(
    () => !skip && refetch({ searchQuery: searchQuery ?? '' }),
    [refetch, searchQuery, skip]
  )

  return useMemo(
    () => ({ data: formattedData, loading, error: persistedError, refetch: retry }),
    [formattedData, loading, retry, persistedError]
  )
}
