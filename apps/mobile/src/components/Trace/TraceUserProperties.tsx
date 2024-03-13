import { useEffect } from 'react'
import { NativeModules } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import {
  useBiometricAppSettings,
  useDeviceSupportsBiometricAuth,
} from 'src/features/biometrics/hooks'
import { setUserProperty } from 'src/features/telemetry'
import { UserPropertyName, getAuthMethod } from 'src/features/telemetry/constants'
import { selectAllowAnalytics } from 'src/features/telemetry/selectors'
import { getFullAppVersion } from 'src/utils/version'
import { useIsDarkMode } from 'ui/src'
import { isAndroid } from 'uniswap/src/utils/platform'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { useAppFiatCurrency } from 'wallet/src/features/fiatCurrency/hooks'
import { useCurrentLanguageInfo } from 'wallet/src/features/language/hooks'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import {
  useActiveAccount,
  useHideSmallBalancesSetting,
  useHideSpamTokensSetting,
  useNonPendingSignerAccounts,
  useSwapProtectionSetting,
  useViewOnlyAccounts,
} from 'wallet/src/features/wallet/hooks'

/** Component that tracks UserProperties during the lifetime of the app */
export function TraceUserProperties(): null {
  const isDarkMode = useIsDarkMode()
  const viewOnlyAccounts = useViewOnlyAccounts()
  const activeAccount = useActiveAccount()
  const signerAccounts = useNonPendingSignerAccounts()
  const biometricsAppSettingsState = useBiometricAppSettings()
  const { touchId, faceId } = useDeviceSupportsBiometricAuth()
  const swapProtectionSetting = useSwapProtectionSetting()
  const currentLanguage = useCurrentLanguageInfo().loggingName
  const currentFiatCurrency = useAppFiatCurrency()
  const hideSpamTokens = useHideSpamTokensSetting()
  const hideSmallBalances = useHideSmallBalancesSetting()

  // Effects must check this and ensure they are setting properties for when analytics is reenabled
  const allowAnalytics = useAppSelector(selectAllowAnalytics)

  useEffect(() => {
    setUserProperty(UserPropertyName.AppVersion, getFullAppVersion())
    if (isAndroid) {
      NativeModules.AndroidDeviceModule.getPerformanceClass().then((perfClass: number) => {
        setUserProperty(UserPropertyName.AndroidPerfClass, perfClass)
      })
    }
    return () => {
      analytics.flushEvents()
    }
  }, [allowAnalytics])

  useEffect(() => {
    setUserProperty(UserPropertyName.WalletSwapProtectionSetting, swapProtectionSetting)
  }, [allowAnalytics, swapProtectionSetting])

  useEffect(() => {
    setUserProperty(UserPropertyName.DarkMode, isDarkMode)
  }, [allowAnalytics, isDarkMode])

  useEffect(() => {
    setUserProperty(UserPropertyName.WalletSignerCount, signerAccounts.length)
    setUserProperty(
      UserPropertyName.WalletSignerAccounts,
      signerAccounts.map((account) => account.address)
    )
  }, [allowAnalytics, signerAccounts])

  useEffect(() => {
    setUserProperty(UserPropertyName.WalletViewOnlyCount, viewOnlyAccounts.length)
  }, [allowAnalytics, viewOnlyAccounts])

  useEffect(() => {
    if (!activeAccount) {
      return
    }
    setUserProperty(UserPropertyName.ActiveWalletAddress, activeAccount.address)
    setUserProperty(UserPropertyName.ActiveWalletType, activeAccount.type)
    setUserProperty(
      UserPropertyName.IsCloudBackedUp,
      Boolean(activeAccount.backups?.includes(BackupType.Cloud))
    )
    setUserProperty(UserPropertyName.IsPushEnabled, Boolean(activeAccount.pushNotificationsEnabled))

    setUserProperty(UserPropertyName.IsHideSmallBalancesEnabled, hideSmallBalances)
    setUserProperty(UserPropertyName.IsHideSpamTokensEnabled, hideSpamTokens)
  }, [allowAnalytics, activeAccount, hideSmallBalances, hideSpamTokens])

  useEffect(() => {
    setUserProperty(
      UserPropertyName.AppOpenAuthMethod,
      getAuthMethod(biometricsAppSettingsState.requiredForAppAccess, touchId, faceId)
    )
    setUserProperty(
      UserPropertyName.TransactionAuthMethod,
      getAuthMethod(biometricsAppSettingsState.requiredForTransactions, touchId, faceId)
    )
  }, [allowAnalytics, biometricsAppSettingsState, touchId, faceId])

  useEffect(() => {
    setUserProperty(UserPropertyName.Language, currentLanguage)
  }, [allowAnalytics, currentLanguage])

  useEffect(() => {
    setUserProperty(UserPropertyName.Currency, currentFiatCurrency)
  }, [allowAnalytics, currentFiatCurrency])

  return null
}
