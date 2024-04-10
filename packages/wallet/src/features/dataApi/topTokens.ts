import { useMemo } from 'react'
import {
  TokenSortableField,
  useTopTokensQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { ChainId } from 'wallet/src/constants/chains'
import { toGraphQLChain } from 'wallet/src/features/chains/utils'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { gqlTokenToCurrencyInfo, usePersistedError } from 'wallet/src/features/dataApi/utils'

export function usePopularTokens(chainFilter: ChainId): GqlResult<CurrencyInfo[]> {
  const gqlChainFilter = toGraphQLChain(chainFilter)

  const { data, loading, error, refetch } = useTopTokensQuery({
    variables: {
      chain: gqlChainFilter,
      page: 1,
      pageSize: 100,
      orderBy: TokenSortableField.Popularity,
    },
  })
  const persistedError = usePersistedError(loading, error)

  const formattedData = useMemo(() => {
    if (!data || !data.topTokens) {
      return
    }

    return data.topTokens
      .map((token) => {
        if (!token) {
          return null
        }

        return gqlTokenToCurrencyInfo(token)
      })
      .filter((c): c is CurrencyInfo => Boolean(c))
  }, [data])

  return useMemo(
    () => ({ data: formattedData, loading, error: persistedError, refetch }),
    [formattedData, loading, persistedError, refetch]
  )
}
