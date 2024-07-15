import { NativeStackScreenProps } from '@react-navigation/native-stack'
import dayjs from 'dayjs'
import { isEnrolledAsync } from 'expo-local-authentication'
import { t } from 'i18next'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { SplashScreen } from 'src/features/appLoading/SplashScreen'
import { useBiometricContext } from 'src/features/biometrics/context'
import { useBiometricAppSettings } from 'src/features/biometrics/hooks'
import {
  NotificationPermission,
  useNotificationOSPermissionsEnabled,
} from 'src/features/notifications/hooks/useNotificationOSPermissionsEnabled'
import { RecoveryWalletInfo, useOnDeviceRecoveryData } from 'src/screens/Import/useOnDeviceRecoveryData'
import { hideSplashScreen } from 'src/utils/splashScreen'
import { DynamicConfigs, OnDeviceRecoveryConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { AccountType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { selectAnyAddressHasNotificationsEnabled } from 'wallet/src/features/wallet/selectors'
import { setFinishedOnboarding } from 'wallet/src/features/wallet/slice'
import { useAppSelector } from 'wallet/src/state'

export const SPLASH_SCREEN = { uri: 'SplashScreen' }

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.AppLoading>

function useFinishAutomatedRecovery(navigation: Props['navigation']): {
  finishRecovery: (mnemonicId: string, recoveryWalletInfos: RecoveryWalletInfo[]) => void
} {
  const dispatch = useDispatch()
  const { setRecoveredImportedAccounts, finishOnboarding } = useOnboardingContext()

  const notificationOSPermission = useNotificationOSPermissionsEnabled()
  const hasAnyNotificationsEnabled = useAppSelector(selectAnyAddressHasNotificationsEnabled)
  const { deviceSupportsBiometrics } = useBiometricContext()
  const { requiredForTransactions: isBiometricAuthEnabled } = useBiometricAppSettings()

  const importAccounts = useCallback(
    async (mnemonicId: string, recoveryWalletInfos: RecoveryWalletInfo[]) => {
      const accountsToImport = recoveryWalletInfos.map((addressInfo, index): SignerMnemonicAccount => {
        return {
          type: AccountType.SignerMnemonic,
          mnemonicId,
          name: t('onboarding.wallet.defaultName', { number: index + 1 }),
          address: addressInfo.address,
          derivationIndex: addressInfo.derivationIndex,
          timeImportedMs: dayjs().valueOf(),
        }
      })
      setRecoveredImportedAccounts(accountsToImport)
    },
    [setRecoveredImportedAccounts],
  )

  const finishRecovery = useCallback(
    async (mnemonicId: string, recoveryWalletInfos: RecoveryWalletInfo[]) => {
      await importAccounts(mnemonicId, recoveryWalletInfos)

      const isBiometricsEnrolled = await isEnrolledAsync()

      const showNotificationScreen = notificationOSPermission !== NotificationPermission.Enabled
      const showBiometricsScreen =
        (deviceSupportsBiometrics && (!isBiometricAuthEnabled || !isBiometricsEnrolled)) ?? false

      sendAnalyticsEvent(MobileEventName.AutomatedOnDeviceRecoveryTriggered, {
        showNotificationScreen,
        showBiometricsScreen,
        notificationOSPermission,
        hasAnyNotificationsEnabled,
        deviceSupportsBiometrics,
        isBiometricsEnrolled,
        isBiometricAuthEnabled,
      })

      hideSplashScreen()

      // Notification screen should always navigate to biometrics screen if supported
      // This is acceptable because we're already triggering a setup screen
      // and biometrics is the more important one to include
      if (showNotificationScreen) {
        navigation.replace(OnboardingScreens.Notifications, {
          importType: ImportType.OnDeviceRecovery,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
        })
      } else if (showBiometricsScreen) {
        navigation.replace(OnboardingScreens.Security, {
          importType: ImportType.OnDeviceRecovery,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
        })
      } else {
        await finishOnboarding({ importType: ImportType.OnDeviceRecovery })
        dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
      }
    },
    [
      deviceSupportsBiometrics,
      dispatch,
      finishOnboarding,
      hasAnyNotificationsEnabled,
      importAccounts,
      isBiometricAuthEnabled,
      navigation,
      notificationOSPermission,
    ],
  )

  return {
    finishRecovery,
  }
}

const FALLBACK_APP_LOADING_TIMEOUT_MS = 15000

export function AppLoadingScreen({ navigation }: Props): JSX.Element | null {
  const dispatch = useDispatch()

  const appLoadingTimeoutMs = useDynamicConfigValue(
    DynamicConfigs.OnDeviceRecovery,
    OnDeviceRecoveryConfigKey.AppLoadingTimeoutMs,
    FALLBACK_APP_LOADING_TIMEOUT_MS,
  )
  const maxMnemonicsToLoad = useDynamicConfigValue(
    DynamicConfigs.OnDeviceRecovery,
    OnDeviceRecoveryConfigKey.MaxMnemonicsToLoad,
    20,
  )

  const [finished, setFinished] = useState(false)

  const [mnemonicIds, setMnemonicIds] = useState<string[]>()
  const { significantRecoveryWalletInfos, loading } = useOnDeviceRecoveryData(mnemonicIds?.[0])
  const { finishRecovery } = useFinishAutomatedRecovery(navigation)

  const navigateToLanding = useCallback((): void => {
    navigation.replace(OnboardingScreens.Landing, {
      importType: ImportType.NotYetSelected,
      entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
    })
  }, [navigation])

  useEffect(() => {
    Keyring.getMnemonicIds()
      .then((storedMnemonicIds) => setMnemonicIds(storedMnemonicIds))
      .catch(() => {
        logger.error('Failed to load mnemonic ids', {
          tags: { file: 'AppLoadingScreen', function: 'getMnemonicIds' },
        })
        setMnemonicIds([]) // Needed to leave the loading screen
      })
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!finished) {
        setFinished(true)
        navigateToLanding()
        logger.warn('AppLoadingScreen', 'useTimeout', `Loading timeout triggered after ${appLoadingTimeoutMs}ms`)
      }
    }, appLoadingTimeoutMs)
    return () => clearTimeout(timeout)
  }, [appLoadingTimeoutMs, finished, navigateToLanding])

  // Logic to determine what screen to show on app load
  useEffect(() => {
    async function checkOnDeviceRecovery(): Promise<void> {
      if (!mnemonicIds || loading || finished) {
        return
      }

      const mnemonicIdsCount = mnemonicIds.length
      const firstMnemonicId = mnemonicIds[0]

      // Used to stop this running multiple times as the following logic is async
      setFinished(true)

      if (mnemonicIdsCount === 1 && firstMnemonicId) {
        if (significantRecoveryWalletInfos.length) {
          finishRecovery(firstMnemonicId, significantRecoveryWalletInfos)
        } else {
          navigateToLanding()
        }
      } else if (mnemonicIdsCount > 1) {
        navigation.replace(OnboardingScreens.OnDeviceRecovery, {
          importType: ImportType.OnDeviceRecovery,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
          mnemonicIds: mnemonicIds.slice(0, maxMnemonicsToLoad),
        })
      } else {
        navigateToLanding()
      }
    }
    checkOnDeviceRecovery().catch(() => {
      logger.warn('AppLoadingScreen', 'checkOnDeviceRecovery', 'Failed to check on device recovery')
    })
  }, [
    dispatch,
    finishRecovery,
    finished,
    loading,
    maxMnemonicsToLoad,
    mnemonicIds,
    navigateToLanding,
    navigation,
    significantRecoveryWalletInfos,
  ])

  return <SplashScreen />
}
