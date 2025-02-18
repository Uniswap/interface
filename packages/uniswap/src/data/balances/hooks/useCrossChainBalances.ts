import { WatchQueryFetchPolicy } from '@apollo/client'
import { useMemo } from 'react'
import { useBalances } from 'uniswap/src/data/balances/hooks/useBalances'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyId, buildNativeCurrencyId, currencyIdToChain } from 'uniswap/src/utils/currencyId'

export function useCrossChainBalances({
  address,
  currencyId,
  crossChainTokens,
  fetchPolicy = 'cache-and-network',
}: {
  address: Address
  currencyId: string
  crossChainTokens: Maybe<{ chain: Chain; address?: Maybe<string> }[]>
  fetchPolicy?: WatchQueryFetchPolicy
}): {
  currentChainBalance: PortfolioBalance | null
  otherChainBalances: PortfolioBalance[] | null
} {
  const currentChainBalance =
    useBalances({
      address,
      currencies: [currencyId],
      fetchPolicy,
    })?.[0] ?? null

  const currentChainId = currencyIdToChain(currencyId)

  const bridgedCurrencyIds = useMemo(
    () =>
      crossChainTokens
        ?.map(({ chain, address: currencyAddress }) => {
          const chainId = fromGraphQLChain(chain)
          if (!chainId || chainId === currentChainId) {
            return null
          }
          if (!currencyAddress) {
            return buildNativeCurrencyId(chainId)
          }
          return buildCurrencyId(chainId, currencyAddress)
        })
        .filter((b): b is string => !!b),

    [crossChainTokens, currentChainId],
  )

  const otherChainBalances = useBalances({ address, currencies: bridgedCurrencyIds })

  return {
    currentChainBalance,
    otherChainBalances,
  }
}
