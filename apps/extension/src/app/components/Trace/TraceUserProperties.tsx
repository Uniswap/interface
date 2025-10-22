import { datadogRum } from '@datadog/browser-rum'
import { useEffect } from 'react'
import { useIsDarkMode } from 'ui/src'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguage } from 'uniswap/src/features/language/hooks'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { ExtensionUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
// biome-ignore lint/style/noRestrictedImports: Direct analytics import required for user property tracking
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { useGatingUserPropertyUsernames } from 'wallet/src/features/gating/userPropertyHooks'
import {
  useActiveAccount,
  useDisplayName,
  useSignerAccounts,
  useViewOnlyAccounts,
} from 'wallet/src/features/wallet/hooks'

/** Component that tracks UserProperties during the lifetime of the app */
export function TraceUserProperties(): null {
  const isDarkMode = useIsDarkMode()
  const viewOnlyAccounts = useViewOnlyAccounts()
  const activeAccount = useActiveAccount()
  const signerAccounts = useSignerAccounts()
  const hideSmallBalances = useHideSmallBalancesSetting()
  const hideSpamTokens = useHideSpamTokensSetting()
  const currentLanguage = useCurrentLanguage()
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const { isTestnetModeEnabled } = useEnabledChains()
  const displayName = useDisplayName(activeAccount?.address)

  useGatingUserPropertyUsernames()

  // Set user properties for datadog

  useEffect(() => {
    datadogRum.setUserProperty(ExtensionUserPropertyName.ActiveWalletAddress, activeAccount?.address)
  }, [activeAccount?.address])

  // Set user properties for amplitude

  useEffect(() => {
    setUserProperty(ExtensionUserPropertyName.AppVersion, chrome.runtime.getManifest().version)
    return () => {
      analytics.flushEvents()
    }
  }, [])

  useEffect(() => {
    setUserProperty(ExtensionUserPropertyName.DarkMode, isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    setUserProperty(ExtensionUserPropertyName.WalletSignerCount, signerAccounts.length)
    setUserProperty(
      ExtensionUserPropertyName.WalletSignerAccounts,
      signerAccounts.map((account) => account.address),
    )
  }, [signerAccounts])

  useEffect(() => {
    setUserProperty(ExtensionUserPropertyName.WalletViewOnlyCount, viewOnlyAccounts.length)
  }, [viewOnlyAccounts])

  useEffect(() => {
    if (!activeAccount) {
      return
    }
    if (activeAccount.backups) {
      setUserProperty(ExtensionUserPropertyName.BackupTypes, activeAccount.backups)
    }
    setUserProperty(ExtensionUserPropertyName.ActiveWalletAddress, activeAccount.address)
    setUserProperty(ExtensionUserPropertyName.ActiveWalletType, activeAccount.type)
    setUserProperty(ExtensionUserPropertyName.IsHideSmallBalancesEnabled, hideSmallBalances)
    setUserProperty(ExtensionUserPropertyName.IsHideSpamTokensEnabled, hideSpamTokens)
  }, [activeAccount, hideSmallBalances, hideSpamTokens])

  useEffect(() => {
    setUserProperty(ExtensionUserPropertyName.Language, currentLanguage)
  }, [currentLanguage])

  useEffect(() => {
    setUserProperty(ExtensionUserPropertyName.Currency, appFiatCurrencyInfo.code)
  }, [appFiatCurrencyInfo])

  useEffect(() => {
    setUserProperty(ExtensionUserPropertyName.TestnetModeEnabled, isTestnetModeEnabled)
  }, [isTestnetModeEnabled])

  // Log ENS and Unitag ownership for user usage stats
  useEffect(() => {
    switch (displayName?.type) {
      case DisplayNameType.ENS:
        setUserProperty(ExtensionUserPropertyName.HasLoadedENS, true)
        return
      case DisplayNameType.Unitag:
        setUserProperty(ExtensionUserPropertyName.HasLoadedUnitag, true)
        return
      default:
        return
    }
  }, [displayName?.type])

  return null
}
