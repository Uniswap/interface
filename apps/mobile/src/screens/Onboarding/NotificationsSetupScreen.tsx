import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Image, Platform, StyleSheet } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import Trace from 'src/components/Trace/Trace'
import { BackButton } from 'src/components/buttons/BackButton'
import { useBiometricContext } from 'src/features/biometrics/context'
import { useBiometricAppSettings } from 'src/features/biometrics/hooks'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { OnboardingScreens } from 'src/screens/Screens'
import { Button, Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { ONBOARDING_NOTIFICATIONS_DARK, ONBOARDING_NOTIFICATIONS_LIGHT } from 'ui/src/assets'
import { isIOS } from 'uniswap/src/utils/platform'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useNativeAccountExists } from 'wallet/src/features/wallet/hooks'
import { selectAccounts } from 'wallet/src/features/wallet/selectors'
import i18n from 'wallet/src/i18n/i18n'
import { ElementName } from 'wallet/src/telemetry/constants'
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
    ]
  )
}

export function NotificationsSetupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const { requiredForTransactions: isBiometricAuthEnabled } = useBiometricAppSettings()
  const accounts = useAppSelector(selectAccounts)
  const dispatch = useAppDispatch()
  const addresses = Object.keys(accounts)
  const hasSeedPhrase = useNativeAccountExists()
  const { deviceSupportsBiometrics } = useBiometricContext()

  const onCompleteOnboarding = useCompleteOnboardingCallback(params)

  const renderBackButton = useCallback(
    (nav: OnboardingScreens): JSX.Element => (
      <BackButton
        onPressBack={(): void => navigation.navigate({ name: nav, params, merge: true })}
      />
    ),
    [navigation, params]
  )

  /* For some screens, we want to override the back button to go to a different screen.
   * This helps avoid re-visiting loading states or confirmation views.
   */
  useEffect(() => {
    const shouldOverrideBackButton = [
      ImportType.SeedPhrase,
      ImportType.Restore,
      ImportType.CreateNew,
    ].includes(params.importType)
    if (shouldOverrideBackButton) {
      const nextScreen =
        params.importType === ImportType.Restore
          ? OnboardingScreens.RestoreCloudBackup
          : OnboardingScreens.Backup
      navigation.setOptions({
        headerLeft: () => renderBackButton(nextScreen),
      })
    }
  }, [navigation, params, renderBackButton])

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
  }, [
    deviceSupportsBiometrics,
    hasSeedPhrase,
    isBiometricAuthEnabled,
    navigation,
    onCompleteOnboarding,
    params,
  ])

  const onPressEnableNotifications = useCallback(async () => {
    promptPushPermission(() => {
      addresses.forEach((address) => {
        dispatch(
          editAccountActions.trigger({
            type: EditAccountAction.TogglePushNotification,
            enabled: true,
            address,
          })
        )
      })
    }, showNotificationSettingsAlert)

    await navigateToNextScreen()
  }, [addresses, dispatch, navigateToNextScreen])

  return (
    <OnboardingScreen
      subtitle={t('onboarding.notification.subtitle')}
      title={t('onboarding.notification.title')}>
      <Flex centered shrink py={isIOS ? '$spacing60' : '$spacing16'}>
        <NotificationsBackgroundImage />
      </Flex>
      <Flex gap="$spacing24">
        <Trace logPress element={ElementName.Skip}>
          <TouchableArea testID={ElementName.Skip} onPress={navigateToNextScreen}>
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
      source={
        isDarkMode
          ? Platform.select(ONBOARDING_NOTIFICATIONS_DARK)
          : Platform.select(ONBOARDING_NOTIFICATIONS_LIGHT)
      }
      style={styles.image}
    />
  )
}

const styles = StyleSheet.create({
  image: {
    height: '100%',
    resizeMode: 'contain',
    width: '100%',
  },
})
