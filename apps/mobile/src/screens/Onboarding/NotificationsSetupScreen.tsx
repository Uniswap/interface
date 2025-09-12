import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { NotificationsBackgroundImage } from 'src/components/notifications/NotificationsBGImage'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricsState } from 'src/features/biometrics/useBiometricsState'
import { usePromptPushPermission } from 'src/features/notifications/hooks/usePromptPushPermission'
import { showNotificationSettingsAlert } from 'src/features/notifications/showNotificationSettingsAlert'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { Button, Flex } from 'ui/src'
import { BellOn } from 'ui/src/components/icons'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { useNativeAccountExists } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Notifications>

export function NotificationsSetupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const { requiredForTransactions: isBiometricAuthEnabled } = useBiometricAppSettings()
  const hasSeedPhrase = useNativeAccountExists()
  const { deviceSupportsBiometrics } = useBiometricsState()
  const promptPushPermission = usePromptPushPermission()
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

    if (!arePushNotificationsEnabled) {
      showNotificationSettingsAlert()
    }

    await navigateToNextScreen()
  }, [navigateToNextScreen, promptPushPermission])

  return (
    <OnboardingScreen
      disableGoBack={params.importType !== ImportType.CreateNew}
      Icon={BellOn}
      subtitle={t('onboarding.notification.subtitle')}
      title={t('onboarding.notification.title')}
      onSkip={navigateToNextScreen}
    >
      <Flex fill centered shrink>
        <NotificationsBackgroundImage />
      </Flex>
      <Trace logPress element={ElementName.Enable}>
        <Flex centered row>
          <Button variant="branded" size="large" testID="turn-on-notifications" onPress={onPressEnableNotifications}>
            {t('common.button.enable')}
          </Button>
        </Flex>
      </Trace>
    </OnboardingScreen>
  )
}
