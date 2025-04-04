import { useEffect, useMemo } from 'react'
import { NativeModules } from 'react-native'
import { OneSignal } from 'react-native-onesignal'
import { useSelector } from 'react-redux'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useDeviceSupportsBiometricAuth } from 'src/features/biometrics/useDeviceSupportsBiometricAuth'
import { OneSignalUserTagField } from 'src/features/notifications/constants'
import { getAuthMethod } from 'src/features/telemetry/utils'
import { getFullAppVersion } from 'src/utils/version'
import { useIsDarkMode } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { MobileUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
import { isAndroid } from 'utilities/src/platform'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { useAccountBalances } from 'wallet/src/features/accounts/useAccountListData'
import { useGatingUserPropertyUsernames } from 'wallet/src/features/gating/userPropertyHooks'
import { selectAllowAnalytics } from 'wallet/src/features/telemetry/selectors'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import {
  useActiveAccount,
  useSignerAccounts,
  useSwapProtectionSetting,
  useViewOnlyAccounts,
} from 'wallet/src/features/wallet/hooks'

/** Component that tracks UserProperties during the lifetime of the app */
export function TraceUserProperties(): null {
  const isDarkMode = useIsDarkMode()
  const viewOnlyAccounts = useViewOnlyAccounts()
  const activeAccount = useActiveAccount()
  const signerAccounts = useSignerAccounts()
  const biometricsAppSettingsState = useBiometricAppSettings()
  const { touchId, faceId } = useDeviceSupportsBiometricAuth()
  const swapProtectionSetting = useSwapProtectionSetting()
  const currentLanguage = useCurrentLanguageInfo().loggingName
  const currentFiatCurrency = useAppFiatCurrency()
  const hideSpamTokens = useHideSpamTokensSetting()
  const hideSmallBalances = useHideSmallBalancesSetting()
  const { isTestnetModeEnabled } = useEnabledChains()

  const signerAccountAddresses = useMemo(() => signerAccounts.map((account) => account.address), [signerAccounts])
  const { totalBalance: signerAccountsTotalBalance } = useAccountBalances({
    addresses: signerAccountAddresses,
    fetchPolicy: 'cache-first',
  })

  // Effects must check this and ensure they are setting properties for when analytics is reenabled
  const allowAnalytics = useSelector(selectAllowAnalytics)

  useGatingUserPropertyUsernames()

  useEffect(() => {
    setUserProperty(MobileUserPropertyName.AppVersion, getFullAppVersion())
    Keyring.getMnemonicIds() // Temporary to prepare for fix, should be removed in 1.28
      .then((mnemonicIds) => {
        setUserProperty(MobileUserPropertyName.MnemonicCount, mnemonicIds.length)
      })
      .catch(() => {})
    if (isAndroid) {
      NativeModules.AndroidDeviceModule.getPerformanceClass().then((perfClass: number) => {
        setUserProperty(MobileUserPropertyName.AndroidPerfClass, perfClass)
      })
    }
    return () => {
      analytics.flushEvents()
    }
  }, [allowAnalytics])

  useEffect(() => {
    setUserProperty(MobileUserPropertyName.WalletSwapProtectionSetting, swapProtectionSetting)
  }, [allowAnalytics, swapProtectionSetting])

  useEffect(() => {
    setUserProperty(MobileUserPropertyName.DarkMode, isDarkMode)
  }, [allowAnalytics, isDarkMode])

  useEffect(() => {
    setUserProperty(MobileUserPropertyName.WalletSignerCount, signerAccountAddresses.length)
    setUserProperty(MobileUserPropertyName.WalletSignerAccounts, signerAccountAddresses)
  }, [allowAnalytics, signerAccountAddresses])

  useEffect(() => {
    setUserProperty(MobileUserPropertyName.WalletViewOnlyCount, viewOnlyAccounts.length)
  }, [allowAnalytics, viewOnlyAccounts])

  useEffect(() => {
    if (!activeAccount) {
      return
    }
    setUserProperty(MobileUserPropertyName.ActiveWalletAddress, activeAccount.address)
    setUserProperty(MobileUserPropertyName.ActiveWalletType, activeAccount.type)
    setUserProperty(MobileUserPropertyName.IsCloudBackedUp, Boolean(activeAccount.backups?.includes(BackupType.Cloud)))
    setUserProperty(MobileUserPropertyName.IsPushEnabled, Boolean(activeAccount.pushNotificationsEnabled))

    setUserProperty(MobileUserPropertyName.IsHideSmallBalancesEnabled, hideSmallBalances)
    setUserProperty(MobileUserPropertyName.IsHideSpamTokensEnabled, hideSpamTokens)
  }, [allowAnalytics, activeAccount, hideSmallBalances, hideSpamTokens])

  useEffect(() => {
    setUserProperty(
      MobileUserPropertyName.AppOpenAuthMethod,
      getAuthMethod(biometricsAppSettingsState.requiredForAppAccess, touchId, faceId),
    )
    setUserProperty(
      MobileUserPropertyName.TransactionAuthMethod,
      getAuthMethod(biometricsAppSettingsState.requiredForTransactions, touchId, faceId),
    )
  }, [allowAnalytics, biometricsAppSettingsState, touchId, faceId])

  useEffect(() => {
    setUserProperty(MobileUserPropertyName.Language, currentLanguage)
  }, [allowAnalytics, currentLanguage])

  useEffect(() => {
    setUserProperty(MobileUserPropertyName.Currency, currentFiatCurrency)
  }, [allowAnalytics, currentFiatCurrency])

  useEffect(() => {
    setUserProperty(MobileUserPropertyName.TestnetModeEnabled, isTestnetModeEnabled)
  }, [allowAnalytics, isTestnetModeEnabled])

  useEffect(() => {
    OneSignal.User.addTag(OneSignalUserTagField.AccountIsUnfunded, signerAccountsTotalBalance === 0 ? 'true' : 'false')
  }, [signerAccountsTotalBalance])

  return null
}
