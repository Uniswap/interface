import { isExtensionApp } from '@universe/environment'
import { useMemo } from 'react'
import type { PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import { buildExtensionMultichainBalancesListData } from 'uniswap/src/features/portfolio/balances/buildExtensionMultichainBalancesListData'
import type { SortedPortfolioBalancesMultichain } from 'uniswap/src/features/portfolio/balances/types'
import type { CurrencyIdToVisibility } from 'uniswap/src/features/visibility/slice'

/**
 * Extension sidebar: derives list UI data via {@link buildExtensionMultichainBalancesListData}.
 * Web/mobile use raw sorted portfolio data. Same hook runs everywhere; work is skipped when {@link isExtensionApp} is false.
 */
export function useMultichainBalancesListData({
  sortedData,
  balancesById,
  isTestnetModeEnabled,
  currencyIdToTokenVisibility,
}: {
  sortedData: SortedPortfolioBalancesMultichain | undefined
  balancesById: Record<string, PortfolioMultichainBalance> | undefined
  isTestnetModeEnabled: boolean
  currencyIdToTokenVisibility: CurrencyIdToVisibility
}): {
  sortedDataForList: SortedPortfolioBalancesMultichain | undefined
  balancesByIdForList: Record<string, PortfolioMultichainBalance> | undefined
  hiddenTokensCount: number
} {
  return useMemo(() => {
    if (!isExtensionApp || !sortedData || !balancesById) {
      return {
        sortedDataForList: sortedData,
        balancesByIdForList: balancesById,
        hiddenTokensCount: sortedData?.hiddenBalances.length ?? 0,
      }
    }

    const built = buildExtensionMultichainBalancesListData({
      sortedBalances: sortedData,
      balancesById,
      isTestnetModeEnabled,
      currencyIdToTokenVisibility,
    })

    return {
      sortedDataForList: built.sortedDataForUi,
      balancesByIdForList: built.listBalancesById,
      hiddenTokensCount: built.hiddenTokensCount,
    }
  }, [sortedData, balancesById, isTestnetModeEnabled, currencyIdToTokenVisibility])
}
