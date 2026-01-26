import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { useOnChainPortfolioTotalValue } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useOnChainPortfolioTotalValue'

export function useIsPortfolioZero(): boolean {
  const wallet = useWallet()
  const { isTestnetModeEnabled } = useEnabledChains()
  // 使用链上查询替代 Uniswap GetPortfolio API
  const { balanceUSD, loading, error } = useOnChainPortfolioTotalValue({
    evmAddress: wallet.evmAccount?.address,
    svmAddress: wallet.svmAccount?.address,
  })

  return !isTestnetModeEnabled && balanceUSD === 0
}
