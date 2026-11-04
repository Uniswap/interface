import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'

export function useIsPortfolioZero(): boolean {
  const { isTestnetModeEnabled } = useEnabledChains()
  const activeAddresses = useActiveAddresses()
  const hasActiveAddress = !!(activeAddresses.evmAddress ?? activeAddresses.svmAddress)
  const { data } = usePortfolioTotalValue(activeAddresses)

  // Without an address the balances query still returns the previous account's data as placeholder.
  return !isTestnetModeEnabled && hasActiveAddress && data?.balanceUSD === 0
}
