import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { setUserProperty } from 'src/app/features/telemetry'
import { UserPropertyName } from 'src/app/features/telemetry/constants'
import { analytics } from 'wallet/src/features/telemetry/analytics/analytics'
import {
  useActiveAccount,
  useNonPendingSignerAccounts,
  useViewOnlyAccounts,
} from 'wallet/src/features/wallet/hooks'

/** Component that tracks UserProperties during the lifetime of the app */
export function TraceUserProperties(): null {
  const colorScheme = useColorScheme()
  const viewOnlyAccounts = useViewOnlyAccounts()
  const activeAccount = useActiveAccount()
  const signerAccounts = useNonPendingSignerAccounts()

  useEffect(() => {
    setUserProperty(UserPropertyName.AppVersion, chrome.runtime.getManifest().version)
    return () => {
      analytics.flushEvents()
    }
  }, [])

  useEffect(() => {
    setUserProperty(UserPropertyName.DarkMode, colorScheme === 'dark')
  }, [colorScheme])

  useEffect(() => {
    setUserProperty(UserPropertyName.WalletSignerCount, signerAccounts.length)
    setUserProperty(
      UserPropertyName.WalletSignerAccounts,
      signerAccounts.map((account) => account.address)
    )
  }, [signerAccounts])

  useEffect(() => {
    setUserProperty(UserPropertyName.WalletViewOnlyCount, viewOnlyAccounts.length)
  }, [viewOnlyAccounts])

  useEffect(() => {
    if (!activeAccount) {
      return
    }
    setUserProperty(UserPropertyName.ActiveWalletAddress, activeAccount.address)
    setUserProperty(UserPropertyName.ActiveWalletType, activeAccount.type)
    setUserProperty(UserPropertyName.IsHideSmallBalancesEnabled, !activeAccount.showSmallBalances)
    setUserProperty(UserPropertyName.IsHideSpamTokensEnabled, !activeAccount.showSpamTokens)
  }, [activeAccount])

  return null
}
