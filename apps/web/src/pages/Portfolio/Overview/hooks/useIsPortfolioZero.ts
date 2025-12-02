import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'

/**
 * Hook to determine if the portfolio balance is zero.
 * Denominated portfolio balance on testnet is always 0, so we don't consider it zero in testnet mode.
 */
export function useIsPortfolioZero(): boolean {
  const portfolioAddresses = usePortfolioAddresses()
  const { isTestnetModeEnabled } = useEnabledChains()

  // Fetch portfolio total value to determine if portfolio is zero
  const { data: portfolioData } = usePortfolioTotalValue({
    evmAddress: portfolioAddresses.evmAddress,
    svmAddress: portfolioAddresses.svmAddress,
  })

  const { balanceUSD } = portfolioData || {}

  // Calculate isPortfolioZero - denominated portfolio balance on testnet is always 0
  return useMemo(() => !isTestnetModeEnabled && balanceUSD === 0, [isTestnetModeEnabled, balanceUSD])
}
