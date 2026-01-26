import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { useMemo } from 'react'
import { useAccount } from 'hooks/useAccount'
import { getStablecoinsForChain } from 'uniswap/src/features/chains/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'

/**
 * Hook to determine if the portfolio balance is zero.
 * Denominated portfolio balance on testnet is always 0, so we don't consider it zero in testnet mode.
 */
export function useIsPortfolioZero(): boolean {
  const portfolioAddresses = usePortfolioAddresses()
  const { isTestnetModeEnabled } = useEnabledChains()
  const { chainId } = useAccount()
  const isHashKeyChain =
    chainId === UniverseChainId.HashKey || chainId === UniverseChainId.HashKeyTestnet

  const hskCurrencies = useMemo(() => {
    if (!isHashKeyChain || !chainId) {
      return undefined
    }

    const nativeCurrency = nativeOnChain(chainId)
    const stablecoins = getStablecoinsForChain(chainId)
    return [nativeCurrency, ...stablecoins]
  }, [chainId, isHashKeyChain])

  const hskBalances = useCurrencyBalances(portfolioAddresses.evmAddress, hskCurrencies)
  const hasNonZeroHskBalance = useMemo(
    () => hskBalances.some((balance) => balance?.greaterThan(0)),
    [hskBalances],
  )

  // Fetch portfolio total value to determine if portfolio is zero
  const { data: portfolioData } = usePortfolioTotalValue({
    evmAddress: portfolioAddresses.evmAddress,
    svmAddress: portfolioAddresses.svmAddress,
  })

  const { balanceUSD } = portfolioData || {}

  // Calculate isPortfolioZero - denominated portfolio balance on testnet is always 0
  const defaultIsPortfolioZero = useMemo(
    () => !isTestnetModeEnabled && balanceUSD === 0,
    [isTestnetModeEnabled, balanceUSD],
  )

  // TODO(HSK): Replace on-chain fallback with a dedicated portfolio/price service for HashKey.
  return isHashKeyChain ? !hasNonZeroHskBalance : defaultIsPortfolioZero
}
