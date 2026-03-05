import { type NativeStackScreenProps } from '@react-navigation/native-stack'
import { DynamicConfigs, OnDeviceRecoveryConfigKey, useDynamicConfigValue } from '@universe/gating'
import dayjs from 'dayjs'
import { isEnrolledAsync } from 'expo-local-authentication'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { type OnboardingStackParamList } from 'src/app/navigation/types'
import { SplashScreen } from 'src/features/appLoading/SplashScreen'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricsState } from 'src/features/biometrics/useBiometricsState'
import {
  NotificationPermission,
  useNotificationOSPermissionsEnabled,
} from 'src/features/notifications/hooks/useNotificationOSPermissionsEnabled'
import { useHideSplashScreen } from 'src/features/splashScreen/useHideSplashScreen'
import { type RecoveryWalletInfo, useOnDeviceRecoveryData } from 'src/screens/Import/useOnDeviceRecoveryData'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { type SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { selectAnyAddressHasNotificationsEnabled } from 'wallet/src/features/wallet/selectors'
import { setFinishedOnboarding } from 'wallet/src/features/wallet/slice'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.AppLoading>

function useFinishAutomatedRecovery(navigation: Props['navigation']): {
  finishRecovery: (mnemonicId: string, recoveryWalletInfos: RecoveryWalletInfo[]) => void
} {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { setRecoveredImportedAccounts, finishOnboarding } = useOnboardingContext()
  const hideSplashScreen = useHideSplashScreen()

  const { notificationPermissionsEnabled: notificationOSPermission } = useNotificationOSPermissionsEnabled()
  const hasAnyNotificationsEnabled = useSelector(selectAnyAddressHasNotificationsEnabled)
  const { deviceSupportsBiometrics } = useBiometricsState()
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
          pushNotificationsEnabled: true,
        }
      })
      setRecoveredImportedAccounts(accountsToImport)
    },
    [t, setRecoveredImportedAccounts],
  )

  const finishRecovery = useCallback(
    async (mnemonicId: string, recoveryWalletInfos: RecoveryWalletInfo[]) => {
      logger.debug(
        'AppLoadingScreen',
        'finishRecovery',
        `Starting recovery with ${recoveryWalletInfos.length} wallet(s)`,
      )

      await importAccounts(mnemonicId, recoveryWalletInfos)
      logger.debug('AppLoadingScreen', 'finishRecovery', 'Accounts imported successfully')

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
        logger.debug('AppLoadingScreen', 'finishRecovery', 'Navigating to Notifications screen')
        navigation.replace(OnboardingScreens.Notifications, {
          importType: ImportType.OnDeviceRecovery,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
        })
      } else if (showBiometricsScreen) {
        logger.debug('AppLoadingScreen', 'finishRecovery', 'Navigating to Security screen')
        navigation.replace(OnboardingScreens.Security, {
          importType: ImportType.OnDeviceRecovery,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
        })
      } else {
        logger.debug('AppLoadingScreen', 'finishRecovery', 'Completing recovery directly without setup screens')
        await finishOnboarding({ importType: ImportType.OnDeviceRecovery })
        dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
        logger.debug('AppLoadingScreen', 'finishRecovery', 'Recovery completed successfully')
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
      hideSplashScreen,
    ],
  )

  return {
    finishRecovery,
  }
}

const FALLBACK_APP_LOADING_TIMEOUT_MS = 15000

export function AppLoadingScreen({ navigation }: Props): JSX.Element | null {
  const appLoadingTimeoutMs = useDynamicConfigValue({
    config: DynamicConfigs.OnDeviceRecovery,
    key: OnDeviceRecoveryConfigKey.AppLoadingTimeoutMs,
    defaultValue: FALLBACK_APP_LOADING_TIMEOUT_MS,
  })
  const maxMnemonicsToLoad = useDynamicConfigValue({
    config: DynamicConfigs.OnDeviceRecovery,
    key: OnDeviceRecoveryConfigKey.MaxMnemonicsToLoad,
    defaultValue: 20,
  })

  // Used to stop this running multiple times during navigation
  const [finished, setFinished] = useState(false)

  const [mnemonicIds, setMnemonicIds] = useState<string[]>()
  const { significantRecoveryWalletInfos, loading } = useOnDeviceRecoveryData(mnemonicIds?.[0])
  const { finishRecovery } = useFinishAutomatedRecovery(navigation)

  const navigateToLanding = useCallback((): void => {
    logger.debug('AppLoadingScreen', 'navigateToLanding', 'Navigating to Landing screen')
    navigation.replace(OnboardingScreens.Landing, {
      importType: ImportType.NotYetSelected,
      entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
    })
  }, [navigation])

  useEffect(() => {
    logger.debug('AppLoadingScreen', 'useEffect-getMnemonicIds', 'Starting Keyring.getMnemonicIds() call')
    Keyring.getMnemonicIds()
      .then((storedMnemonicIds) => {
        logger.debug(
          'AppLoadingScreen',
          'useEffect-getMnemonicIds',
          `Successfully fetched ${storedMnemonicIds.length} mnemonic(s)`,
        )
        setMnemonicIds(storedMnemonicIds)
        sendAnalyticsEvent(MobileEventName.AutomatedOnDeviceRecoveryMnemonicsFound, {
          mnemonicCount: storedMnemonicIds.length,
        })
      })
      .catch(() => {
        logger.error('Failed to load mnemonic ids', {
          tags: { file: 'AppLoadingScreen', function: 'useEffect-getMnemonicIds' },
        })
        setMnemonicIds([]) // Needed to leave the loading screen
      })
  }, [])

  useEffect(() => {
    logger.debug('AppLoadingScreen', 'useEffect-timeout', `Setting up timeout for ${appLoadingTimeoutMs}ms`)
    const timeout = setTimeout(() => {
      if (!finished) {
        setFinished(true)
        navigateToLanding()
        logger.warn('AppLoadingScreen', 'useEffect-timeout', `Loading timeout triggered after ${appLoadingTimeoutMs}ms`)
      }
    }, appLoadingTimeoutMs)
    return () => clearTimeout(timeout)
  }, [appLoadingTimeoutMs, finished, navigateToLanding])

  // Logic to determine what screen to show on app load
  useEffect(() => {
    if (!mnemonicIds || finished) {
      logger.debug(
        'AppLoadingScreen',
        'useEffect-chooseScreen',
        `Early return: mnemonicIds=${mnemonicIds ? 'defined' : 'undefined'}, finished=${finished}`,
      )
      return
    }

    const mnemonicIdsCount = mnemonicIds.length
    const firstMnemonicId = mnemonicIds[0]

    if (mnemonicIdsCount === 1 && firstMnemonicId) {
      if (loading) {
        logger.debug(
          'AppLoadingScreen',
          'useEffect-chooseScreen',
          'Single mnemonic found, waiting for wallet data to load',
        )
        return
      }

      setFinished(true)

      sendAnalyticsEvent(MobileEventName.AutomatedOnDeviceRecoverySingleMnemonicFetched, {
        balance: significantRecoveryWalletInfos[0]?.balance ?? 0,
        hasUnitag: Boolean(significantRecoveryWalletInfos[0]?.unitag),
        hasENS: Boolean(significantRecoveryWalletInfos[0]?.ensName),
      })
      if (significantRecoveryWalletInfos.length) {
        logger.debug(
          'AppLoadingScreen',
          'useEffect-chooseScreen',
          `Finishing recovery with ${significantRecoveryWalletInfos.length} wallet(s)`,
        )
        finishRecovery(firstMnemonicId, significantRecoveryWalletInfos)
      } else {
        logger.debug(
          'AppLoadingScreen',
          'useEffect-chooseScreen',
          'No significant wallets found, navigating to Landing',
        )
        navigateToLanding()
      }
    } else if (mnemonicIdsCount > 1) {
      logger.debug(
        'AppLoadingScreen',
        'useEffect-chooseScreen',
        `Multiple mnemonics (${mnemonicIdsCount}) found, navigating to OnDeviceRecovery screen`,
      )
      setFinished(true)
      navigation.replace(OnboardingScreens.OnDeviceRecovery, {
        importType: ImportType.OnDeviceRecovery,
        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
        mnemonicIds: mnemonicIds.slice(0, maxMnemonicsToLoad),
      })
    } else {
      logger.debug('AppLoadingScreen', 'useEffect-chooseScreen', 'No mnemonics found, navigating to Landing')
      setFinished(true)
      navigateToLanding()
    }
  }, [
    finishRecovery,
    finished,
    loading,
    maxMnemonicsToLoad,
    mnemonicIds,
    navigateToLanding,
    navigation,
    significantRecoveryWalletInfos,
  ])

  return (
    <Trace logImpression screen={OnboardingScreens.AppLoading}>
      <SplashScreen />
    </Trace>
  )
}
