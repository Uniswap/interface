import { useMemo } from 'react'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import {
  TokenSortableField,
  useTopTokensQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { gqlTokenToCurrencyInfo, usePersistedError } from 'uniswap/src/features/dataApi/utils'
import { UniverseChainId } from 'uniswap/src/types/chains'

export function usePopularTokens(chainFilter: UniverseChainId): GqlResult<CurrencyInfo[]> {
  const gqlChainFilter = toGraphQLChain(chainFilter)
  const isTestnet = UNIVERSE_CHAIN_INFO[chainFilter].testnet

  const { data, loading, error, refetch } = useTopTokensQuery({
    variables: {
      chain: gqlChainFilter,
      page: 1,
      pageSize: 100,
      orderBy: TokenSortableField.Popularity,
    },
    skip: isTestnet,
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
    [formattedData, loading, persistedError, refetch],
  )
}
