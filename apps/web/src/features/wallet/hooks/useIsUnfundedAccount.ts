import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { partitionMultichainBalancesByPerChainVisibility } from 'uniswap/src/features/portfolio/balances/buildExtensionMultichainBalancesListData'
import { useSortedPortfolioBalancesMultichain } from 'uniswap/src/features/portfolio/balances/hooks'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { useActiveAddresses } from '~/connection/accounts/hooks'
import { getVaultShareCurrencyIds, withoutVaultShareTokens } from '~/utils/vaultShareTokens'

/**
 * Whether the connected account holds nothing: a zero USD balance and no hidden tokens.
 * Always false in testnet mode, where the USD balance is always 0.
 */
export function useIsUnfundedAccount(): boolean {
  const { evmAddress, svmAddress } = useActiveAddresses()
  const ownerAddresses = useMemo(
    () => [evmAddress, svmAddress].filter((a): a is Address => !!a),
    [evmAddress, svmAddress],
  )
  const currencyIdToTokenVisibility = useCurrencyIdToVisibility(ownerAddresses)
  const { isTestnetModeEnabled } = useEnabledChains()
  const { isLoadingVaults, vaults } = useEarnVaults()

  const { data: portfolioData } = usePortfolioTotalValue({ evmAddress, svmAddress })
  // Same query as the Portfolio token table, so the hidden-token check matches what it lists
  const { data: sortedBalances } = useSortedPortfolioBalancesMultichain({
    evmAddress,
    svmAddress,
    requestMultichainFromBackend: true,
  })

  const hasHiddenTokens = useMemo(() => {
    if (!sortedBalances || isLoadingVaults) {
      return false
    }
    const vaultShareCurrencyIds = getVaultShareCurrencyIds(vaults)
    if (withoutVaultShareTokens({ balances: sortedBalances.hiddenBalances, vaultShareCurrencyIds }).length > 0) {
      return true
    }
    // A visible multichain token can still have some of its chains hidden
    const { partitions } = partitionMultichainBalancesByPerChainVisibility({
      balances: withoutVaultShareTokens({ balances: sortedBalances.balances, vaultShareCurrencyIds }),
      isTestnetModeEnabled,
      currencyIdToTokenVisibility,
    })
    return partitions.some(({ hiddenChainTokens }) => hiddenChainTokens.length > 0)
  }, [sortedBalances, isLoadingVaults, vaults, isTestnetModeEnabled, currencyIdToTokenVisibility])

  const balanceUSD = portfolioData?.balanceUSD
  return !isTestnetModeEnabled && balanceUSD === 0 && !hasHiddenTokens
}
