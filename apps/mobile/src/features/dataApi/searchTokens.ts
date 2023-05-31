import { useCallback, useMemo } from 'react'
import { ChainId } from 'wallet/src/constants/chains'
import { useSearchTokensQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { CurrencyInfo, GqlResult } from 'wallet/src/features/dataApi/types'
import { gqlTokenToCurrencyInfo, usePersistedError } from 'wallet/src/features/dataApi/utils'

export function useSearchTokens(
  searchQuery: string | null,
  chainFilter: ChainId | null,
  skip: boolean
): GqlResult<CurrencyInfo[]> {
  const { data, loading, error, refetch } = useSearchTokensQuery({
    variables: { searchQuery: searchQuery ?? '' },
    skip,
  })

  const persistedError = usePersistedError(loading, error)

  const formattedData = useMemo(() => {
    if (!data || !data.searchTokens) return

    return data.searchTokens
      .map((token) => {
        if (!token) return null

        return gqlTokenToCurrencyInfo(token, chainFilter)
      })
      .filter((c): c is CurrencyInfo => Boolean(c))
  }, [data, chainFilter])

  const retry = useCallback(
    () => !skip && refetch({ searchQuery: searchQuery ?? '' }),
    [refetch, searchQuery, skip]
  )

  return useMemo(
    () => ({ data: formattedData, loading, error: persistedError, refetch: retry }),
    [formattedData, loading, retry, persistedError]
  )
}
