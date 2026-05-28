import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { setAttributesToDatadog } from 'utilities/src/logger/datadog/Datadog'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import {
  selectActiveAccount,
  selectSignerMnemonicAccounts,
  selectViewOnlyAccounts,
} from 'wallet/src/features/wallet/selectors'

/**
 * Helper hook for the home screen to track any user specific attributes.
 */
export function useHomeScreenTracking(): void {
  const favoriteCurrencyIds = useSelector(selectFavoriteTokens)
  const viewOnlyAccounts = useSelector(selectViewOnlyAccounts)
  const signerAccounts = useSelector(selectSignerMnemonicAccounts)
  const activeAccount = useSelector(selectActiveAccount)
  const { data: balanceData } = usePortfolioBalances({
    address: activeAccount?.address,
    fetchPolicy: 'cache-only',
  })
  const tokenCount = balanceData ? Object.keys(balanceData).length : 0

  const setAttributes = useCallback(async () => {
    setAttributesToDatadog({
      tokenCount,
      favoriteTokensCount: favoriteCurrencyIds.length,
      viewOnlyAccountsCount: viewOnlyAccounts.length,
      signerAccountsCount: signerAccounts.length,
    }).catch(() => undefined)
  }, [favoriteCurrencyIds.length, viewOnlyAccounts.length, signerAccounts.length, tokenCount])

  // We are using a timeout here because the datadog initialization takes longer
  // than this hook running. We have considered using a context api or redux
  // but landed on a timeout for simplicity.
  useTimeout(async () => {
    await setAttributes()
  }, ONE_SECOND_MS * 8)
}
