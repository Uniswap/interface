import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'

export function useIsPortfolioZero(): boolean {
  const { isTestnetModeEnabled } = useEnabledChains()
  const { data } = usePortfolioTotalValue(useActiveAddresses())

  return !isTestnetModeEnabled && data?.balanceUSD === 0
}
