import { useEffect } from 'react'
import { NativeModules } from 'react-native'
import { IS_ANDROID } from 'src/constants/globals'
import {
  useBiometricAppSettings,
  useDeviceSupportsBiometricAuth,
} from 'src/features/biometrics/hooks'
import { setUserProperty } from 'src/features/telemetry'
import { getAuthMethod, UserPropertyName } from 'src/features/telemetry/constants'
import { getFullAppVersion } from 'src/utils/version'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import {
  useActiveAccount,
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

  useEffect(() => {
    setUserProperty(UserPropertyName.AppVersion, getFullAppVersion())
    if (IS_ANDROID) {
      NativeModules.AndroidDeviceModule.getPerformanceClass().then((perfClass: number) => {
        setUserProperty(UserPropertyName.AndroidPerfClass, perfClass)
      })
    }
    return () => {
      analytics.flushEvents()
    }
  }, [])

  useEffect(() => {
    setUserProperty(UserPropertyName.WalletSwapProtectionSetting, swapProtectionSetting)
  }, [swapProtectionSetting])

  useEffect(() => {
    setUserProperty(UserPropertyName.DarkMode, isDarkMode)
  }, [isDarkMode])

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
    setUserProperty(
      UserPropertyName.IsCloudBackedUp,
      Boolean(activeAccount.backups?.includes(BackupType.Cloud))
    )
    setUserProperty(UserPropertyName.IsPushEnabled, Boolean(activeAccount.pushNotificationsEnabled))
    setUserProperty(UserPropertyName.IsHideSmallBalancesEnabled, !activeAccount.showSmallBalances)
    setUserProperty(UserPropertyName.IsHideSpamTokensEnabled, !activeAccount.showSpamTokens)
  }, [activeAccount])

  useEffect(() => {
    setUserProperty(
      UserPropertyName.AppOpenAuthMethod,
      getAuthMethod(biometricsAppSettingsState.requiredForAppAccess, touchId, faceId)
    )
    setUserProperty(
      UserPropertyName.TransactionAuthMethod,
      getAuthMethod(biometricsAppSettingsState.requiredForTransactions, touchId, faceId)
    )
  }, [biometricsAppSettingsState, touchId, faceId])

  return null
}
