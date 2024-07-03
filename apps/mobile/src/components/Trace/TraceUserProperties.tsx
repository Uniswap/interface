import { useEffect } from 'react'
import { NativeModules } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { useBiometricAppSettings, useDeviceSupportsBiometricAuth } from 'src/features/biometrics/hooks'
import { getAuthMethod } from 'src/features/telemetry/utils'
import { getFullAppVersion } from 'src/utils/version'
import { useIsDarkMode } from 'ui/src'
import { MobileUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
import { isAndroid } from 'utilities/src/platform'
import { selectAllowAnalytics } from 'wallet/src/features/telemetry/selectors'
// eslint-disable-next-line no-restricted-imports
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { useAppFiatCurrency } from 'wallet/src/features/fiatCurrency/hooks'
import { useGatingUserPropertyUsernames } from 'wallet/src/features/gating/userPropertyHooks'
import { useCurrentLanguageInfo } from 'wallet/src/features/language/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import {
  useActiveAccount,
  useHideSmallBalancesSetting,
  useHideSpamTokensSetting,
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

  // Effects must check this and ensure they are setting properties for when analytics is reenabled
  const allowAnalytics = useAppSelector(selectAllowAnalytics)

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
    setUserProperty(MobileUserPropertyName.WalletSignerCount, signerAccounts.length)
    setUserProperty(
      MobileUserPropertyName.WalletSignerAccounts,
      signerAccounts.map((account) => account.address),
    )
  }, [allowAnalytics, signerAccounts])

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

  return null
}
