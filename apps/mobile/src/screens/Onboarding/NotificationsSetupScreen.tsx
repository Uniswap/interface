import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { NotificationsBackgroundImage } from 'src/components/notifications/NotificationsBGImage'
import { useBiometricContext } from 'src/features/biometrics/context'
import { useBiometricAppSettings } from 'src/features/biometrics/hooks'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { DeprecatedButton, Flex } from 'ui/src'
import { BellOn } from 'ui/src/components/icons'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import i18n from 'uniswap/src/i18n'
import { OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { useNativeAccountExists } from 'wallet/src/features/wallet/hooks'
import { openSettings } from 'wallet/src/utils/linking'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Notifications>

export const showNotificationSettingsAlert = (): void => {
  Alert.alert(
    i18n.t('onboarding.notification.permission.title'),
    i18n.t('onboarding.notification.permission.message'),
    [
      { text: i18n.t('common.navigation.settings'), onPress: openSettings },
      {
        text: i18n.t('common.button.cancel'),
      },
    ],
  )
}

export function NotificationsSetupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const { requiredForTransactions: isBiometricAuthEnabled } = useBiometricAppSettings()
  const hasSeedPhrase = useNativeAccountExists()
  const { deviceSupportsBiometrics } = useBiometricContext()
  const { enableNotifications } = useOnboardingContext()

  const onCompleteOnboarding = useCompleteOnboardingCallback(params)

  const navigateToNextScreen = useCallback(async () => {
    // Skip security setup if already enabled or already imported seed phrase
    if (
      !deviceSupportsBiometrics ||
      isBiometricAuthEnabled ||
      (params.entryPoint === OnboardingEntryPoint.Sidebar && hasSeedPhrase)
    ) {
      await onCompleteOnboarding()
    } else {
      navigation.navigate({ name: OnboardingScreens.Security, params, merge: true })
    }
  }, [deviceSupportsBiometrics, hasSeedPhrase, isBiometricAuthEnabled, navigation, onCompleteOnboarding, params])

  const onPressEnableNotifications = useCallback(async () => {
    const arePushNotificationsEnabled = await promptPushPermission()

    if (arePushNotificationsEnabled) {
      enableNotifications()
    } else {
      showNotificationSettingsAlert()
    }

    await navigateToNextScreen()
  }, [enableNotifications, navigateToNextScreen])

  return (
    <OnboardingScreen
      disableGoBack
      Icon={BellOn}
      subtitle={t('onboarding.notification.subtitle')}
      title={t('onboarding.notification.title')}
      onSkip={navigateToNextScreen}
    >
      <Flex fill centered shrink>
        <NotificationsBackgroundImage />
      </Flex>
      <Trace logPress element={ElementName.Enable}>
        <DeprecatedButton testID="turn-on-notifications" onPress={onPressEnableNotifications}>
          {t('common.button.enable')}
        </DeprecatedButton>
      </Trace>
    </OnboardingScreen>
  )
}
