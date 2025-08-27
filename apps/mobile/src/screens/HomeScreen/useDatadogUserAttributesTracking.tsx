import { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useDatadogStatus } from 'src/features/datadog/DatadogContext'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { setAttributesToDatadog } from 'utilities/src/logger/datadog/Datadog'
import { logger } from 'utilities/src/logger/logger'
import {
  selectActiveAccount,
  selectSignerMnemonicAccounts,
  selectViewOnlyAccounts,
} from 'wallet/src/features/wallet/selectors'

/**
 * Helper hook for tracking user specific attributes once logged in.
 */
export function useDatadogUserAttributesTracking({ isOnboarded }: { isOnboarded: boolean }): void {
  const { isInitialized } = useDatadogStatus()
  const favoriteCurrencyIds = useSelector(selectFavoriteTokens)
  const viewOnlyAccounts = useSelector(selectViewOnlyAccounts)
  const signerAccounts = useSelector(selectSignerMnemonicAccounts)
  const activeAccount = useSelector(selectActiveAccount)

  const { data: balanceData } = usePortfolioBalances({
    evmAddress: activeAccount?.address,
    fetchPolicy: 'cache-only',
  })

  const tokenCount = balanceData ? Object.keys(balanceData).length : 0

  const setAttributes = useCallback(async () => {
    setAttributesToDatadog({
      tokenCount,
      favoriteTokensCount: favoriteCurrencyIds.length,
      viewOnlyAccountsCount: viewOnlyAccounts.length,
      signerAccountsCount: signerAccounts.length,
    }).catch((e: Error) => logger.error(e, { tags: { file: 'useHomeScreenTracking.tsx', function: 'setAttributes' } }))
  }, [favoriteCurrencyIds.length, viewOnlyAccounts.length, signerAccounts.length, tokenCount])

  useEffect(() => {
    if (isInitialized && isOnboarded && balanceData) {
      setAttributes().catch(() => undefined)
    }
  }, [isInitialized, setAttributes, isOnboarded, balanceData])
}
