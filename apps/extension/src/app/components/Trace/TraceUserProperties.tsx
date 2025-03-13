import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguage } from 'uniswap/src/features/language/hooks'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { ExtensionUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { useGatingUserPropertyUsernames } from 'wallet/src/features/gating/userPropertyHooks'
import { useActiveAccount, useSignerAccounts, useViewOnlyAccounts } from 'wallet/src/features/wallet/hooks'

/** Component that tracks UserProperties during the lifetime of the app */
export function TraceUserProperties(): null {
  const colorScheme = useColorScheme()
  const viewOnlyAccounts = useViewOnlyAccounts()
  const activeAccount = useActiveAccount()
  const signerAccounts = useSignerAccounts()
  const hideSmallBalances = useHideSmallBalancesSetting()
  const hideSpamTokens = useHideSpamTokensSetting()
  const currentLanguage = useCurrentLanguage()
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const { isTestnetModeEnabled } = useEnabledChains()

  useGatingUserPropertyUsernames()

  useEffect(() => {
    setUserProperty(ExtensionUserPropertyName.AppVersion, chrome.runtime.getManifest().version)
    return () => {
      analytics.flushEvents()
    }
  }, [])

  useEffect(() => {
    setUserProperty(ExtensionUserPropertyName.DarkMode, colorScheme === 'dark')
  }, [colorScheme])

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

  return null
}
