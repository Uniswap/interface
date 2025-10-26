import { useActiveAddresses } from 'features/accounts/store/hooks'
import { useMemo } from 'react'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { currencyKey } from 'utils/currencyKey'

type TokenBalances = { [tokenAddress: string]: { usdValue: number; balance: number } }

/**
 * Returns the user's token balances via the factory hook that switches between GraphQL and REST.
 */
export function useTokenBalances({ cacheOnly }: { cacheOnly?: boolean } = {}): {
  balanceMap: TokenBalances
  balanceList: readonly PortfolioBalance[]
  loading: boolean
} {
  const activeAddresses = useActiveAddresses()
  const evmAddress = activeAddresses.evmAddress
  const svmAddress = activeAddresses.svmAddress

  // Use the factory hook that handles GraphQL/REST switching
  const { data: balancesById, loading } = usePortfolioBalances({
    evmAddress,
    svmAddress,
    fetchPolicy: cacheOnly ? 'cache-first' : 'cache-and-network',
  })

  return useMemo(() => {
    if (!balancesById) {
      return { balanceMap: {}, balanceList: [], loading }
    }

    const balanceList = Object.values(balancesById)
    const balanceMap = balanceList.reduce((balanceMap, tokenBalance) => {
      const currency = tokenBalance.currencyInfo.currency
      const key = currencyKey(currency)
      const usdValue = tokenBalance.balanceUSD ?? 0
      const balance = tokenBalance.quantity
      balanceMap[key] = { usdValue, balance }
      return balanceMap
    }, {} as TokenBalances)

    return { balanceMap, balanceList, loading }
  }, [balancesById, loading])
}
