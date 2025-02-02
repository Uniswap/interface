import { useTokenBalancesQuery } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { PortfolioBalance } from 'graphql/data/portfolios'
import { useAccount } from 'hooks/useAccount'
import { TokenBalances } from 'lib/hooks/useTokenList/sorting'
import { useMemo } from 'react'
import {
  QuickTokenBalancePartsFragment,
  useQuickTokenBalancesWebQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { currencyKeyFromGraphQL } from 'utils/currencyKey'

/**
 * Returns the user's token balances via graphql as a map and list.
 */
export function useTokenBalances({ cacheOnly }: { cacheOnly?: boolean } = {}): {
  balanceMap: TokenBalances
  balanceList: readonly (QuickTokenBalancePartsFragment | PortfolioBalance | undefined)[]
  loading: boolean
} {
  const account = useAccount()
  const { gqlChains } = useEnabledChains()

  // Quick result is always available at pageload, but never refetched when stale
  const quickQueryResult = useQuickTokenBalancesWebQuery({
    variables: {
      ownerAddress: account.address ?? '',
      chains: gqlChains,
    },
    skip: !account.address,
    fetchPolicy: 'cache-first',
  })
  // Full query result is not available at pageload, but is refetched when needed in UI
  const fullQueryResult = useTokenBalancesQuery({ cacheOnly })
  const { data, loading } = fullQueryResult.data ? fullQueryResult : quickQueryResult

  return useMemo(() => {
    const balanceList = data?.portfolios?.[0]?.tokenBalances ?? []
    const balanceMap =
      balanceList?.reduce((balanceMap, tokenBalance) => {
        if (!tokenBalance?.token) {
          return balanceMap
        }

        const key = currencyKeyFromGraphQL({
          address: tokenBalance.token.address,
          chain: tokenBalance.token.chain,
          standard: tokenBalance.token.standard,
        })
        const usdValue = tokenBalance.denominatedValue?.value ?? 0
        const balance = tokenBalance.quantity ?? 0
        balanceMap[key] = { usdValue, balance }
        return balanceMap
      }, {} as TokenBalances) ?? {}
    return { balanceMap, balanceList, loading }
  }, [data?.portfolios, loading])
}
