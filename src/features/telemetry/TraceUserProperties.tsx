import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import {
  useBiometricAppSettings,
  useDeviceSupportsBiometricAuth,
} from 'src/features/biometrics/hooks'
import { flushAnalyticsEvents, setUserProperty } from 'src/features/telemetry'
import { UserPropertyName } from 'src/features/telemetry/constants'
import { getAuthMethod } from 'src/features/telemetry/utils'
import { BackupType } from 'src/features/wallet/accounts/types'
import { useActiveAccount, useSignerAccounts, useViewOnlyAccounts } from 'src/features/wallet/hooks'
import { getFullAppVersion } from 'src/utils/version'

/** Component that tracks UserProperties during the lifetime of the app */
export function TraceUserProperties() {
  const isDarkMode = useColorScheme() === 'dark'
  const viewOnlyAccounts = useViewOnlyAccounts()
  const activeAccount = useActiveAccount()
  const signerAccounts = useSignerAccounts()
  const biometricsAppSettingsState = useBiometricAppSettings()
  const { touchId, faceId } = useDeviceSupportsBiometricAuth()

  useEffect(() => {
    setUserProperty(UserPropertyName.AppVersion, getFullAppVersion())
    return () => {
      flushAnalyticsEvents()
    }
  }, [])

  useEffect(() => {
    setUserProperty(UserPropertyName.DarkMode, isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    setUserProperty(UserPropertyName.WalletSignerCount, signerAccounts.length)
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
