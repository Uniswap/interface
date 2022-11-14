import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import {
  TokenSortableField,
  TopTokensQuery,
  useTopTokensQuery,
} from 'src/data/__generated__/types-and-hooks'
import { CurrencyInfo, GqlResult } from 'src/features/dataApi/types'
import { usePersistedError } from 'src/features/dataApi/utils'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { fromGraphQLChain, toGraphQLChain } from 'src/utils/chainId'
import { currencyId } from 'src/utils/currencyId'

export function usePopularTokens(
  chainFilter: ChainId,
  hideSpamTokens: boolean
): GqlResult<CurrencyInfo[]> {
  const gqlChainFilter = toGraphQLChain(chainFilter)

  const { data, loading, error, refetch } = useTopTokensQuery({
    variables: {
      chain: gqlChainFilter,
      page: 1,
      pageSize: 100,
      orderBy: TokenSortableField.Volume,
    },
  })
  const persistedError = usePersistedError(loading, error)

  const formattedData = useMemo(() => {
    if (!data || !data.topTokens) return

    return data.topTokens
      .map((token) => {
        if (!token) return null
        if (hideSpamTokens && token.project?.isSpam) return null

        return gqlTokenToCurrencyInfo(token)
      })
      .filter((c): c is CurrencyInfo => Boolean(c))
  }, [data, hideSpamTokens])

  return useMemo(
    () => ({ data: formattedData, loading, error: persistedError, refetch }),
    [formattedData, loading, persistedError, refetch]
  )
}

function gqlTokenToCurrencyInfo(
  token: NonNullable<NonNullable<TopTokensQuery['topTokens']>[0]>
): CurrencyInfo | null {
  const { chain, address, decimals, name, symbol, project } = token
  const chainId = fromGraphQLChain(chain)

  if (!chainId || !decimals || !symbol || !name || !project) return null

  const { logoUrl, safetyLevel, isSpam } = project

  const currency = address
    ? new Token(chainId, address, decimals, symbol, name)
    : new NativeCurrency(chainId)

  const currencyInfo: CurrencyInfo = {
    currency,
    currencyId: currencyId(currency),
    logoUrl,
    safetyLevel,
    isSpam,
  }
  return currencyInfo
}
