import { useTokenBalancesQuery } from 'graphql/data/apollo/TokenBalancesProvider'
import { TokenBalances } from 'lib/hooks/useTokenList/sorting'
import { useMemo } from 'react'
import { PortfolioTokenBalancePartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { currencyKeyFromGraphQL } from 'utils/currencyKey'

/**
 * Returns the user's token balances via graphql as a map and list.
 */
export function useTokenBalances({ cacheOnly }: { cacheOnly?: boolean } = {}): {
  balanceMap: TokenBalances
  balanceList: readonly (PortfolioTokenBalancePartsFragment | undefined)[]
  loading: boolean
} {
  const { data, loading } = useTokenBalancesQuery({ cacheOnly })
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
