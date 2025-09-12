import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

export function useIsPortfolioZero(): boolean {
  const wallet = useWallet()
  const { isTestnetModeEnabled } = useEnabledChains()
  const { data } = usePortfolioTotalValue({
    evmAddress: wallet.evmAccount?.address,
    svmAddress: wallet.svmAccount?.address,
  })

  return !isTestnetModeEnabled && data?.balanceUSD === 0
}
