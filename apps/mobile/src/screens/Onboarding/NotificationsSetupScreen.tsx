import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Image, Platform, StyleSheet } from 'react-native'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { useBiometricContext } from 'src/features/biometrics/context'
import { useBiometricAppSettings } from 'src/features/biometrics/hooks'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { Button, Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { ONBOARDING_NOTIFICATIONS_DARK, ONBOARDING_NOTIFICATIONS_LIGHT } from 'ui/src/assets'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import i18n from 'uniswap/src/i18n/i18n'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { isIOS } from 'utilities/src/platform'
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
    promptPushPermission(() => {
      enableNotifications()
    }, showNotificationSettingsAlert)

    await navigateToNextScreen()
  }, [enableNotifications, navigateToNextScreen])

  return (
    <OnboardingScreen
      disableGoBack
      subtitle={t('onboarding.notification.subtitle')}
      title={t('onboarding.notification.title')}
    >
      <Flex centered shrink py={isIOS ? '$spacing60' : '$spacing16'}>
        <NotificationsBackgroundImage />
      </Flex>
      <Flex gap="$spacing24">
        <Trace logPress element={ElementName.Skip}>
          <TouchableArea testID={TestID.Skip} onPress={navigateToNextScreen}>
            <Text color="$accent1" textAlign="center" variant="buttonLabel2">
              {t('common.button.later')}
            </Text>
          </TouchableArea>
        </Trace>
        <Trace logPress element={ElementName.Enable}>
          <Button testID="turn-on-notifications" onPress={onPressEnableNotifications}>
            {t('common.button.enable')}
          </Button>
        </Trace>
      </Flex>
    </OnboardingScreen>
  )
}

const NotificationsBackgroundImage = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()
  return (
    <Image
      resizeMode="contain"
      source={
        isDarkMode ? Platform.select(ONBOARDING_NOTIFICATIONS_DARK) : Platform.select(ONBOARDING_NOTIFICATIONS_LIGHT)
      }
      style={styles.image}
    />
  )
}

const styles = StyleSheet.create({
  image: {
    height: '100%',
    width: '100%',
  },
})
