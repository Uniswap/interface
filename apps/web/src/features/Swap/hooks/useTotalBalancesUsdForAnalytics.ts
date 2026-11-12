import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

/**
 * Retrieves cached token balances, avoiding new fetches to reduce backend load.
 * Analytics should use balances from transaction flows instead of initiating fetches at pageload.
 */
export function useTotalBalancesUsdForAnalytics(): number | undefined {
  const { evmAccount, svmAccount } = useWallet()
  const { data } = usePortfolioTotalValue({
    evmAddress: evmAccount?.address,
    svmAddress: svmAccount?.address,
    cacheOnly: true,
  })
  return data?.balanceUSD
}
