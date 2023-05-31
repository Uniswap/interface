import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SharedEventName } from '@uniswap/analytics-events'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Image, StyleSheet } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { i18n } from 'src/app/i18n'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { useBiometricAppSettings } from 'src/features/biometrics/hooks'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useNativeAccountExists } from 'src/features/wallet/hooks'
import { selectAccounts } from 'src/features/wallet/selectors'
import { OnboardingScreens } from 'src/screens/Screens'
import { openSettings } from 'src/utils/linking'
import { ONBOARDING_NOTIFICATIONS_DARK, ONBOARDING_NOTIFICATIONS_LIGHT } from 'ui/src/assets'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Notifications>

export const showNotificationSettingsAlert = (): void => {
  Alert.alert(
    i18n.t(
      "To receive notifications, turn on notifications for Uniswap Wallet in your device's settings."
    ),
    '',
    [
      { text: i18n.t('Settings'), onPress: openSettings },
      {
        text: i18n.t('Cancel'),
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

  const onCompleteOnboarding = useCompleteOnboardingCallback(params.entryPoint, params.importType)

  const navigateToNextScreen = (): void => {
    // Skip security setup if already enabled or already imported seed phrase
    if (
      isBiometricAuthEnabled ||
      (params?.entryPoint === OnboardingEntryPoint.Sidebar && hasSeedPhrase)
    ) {
      onCompleteOnboarding()
    } else {
      navigation.navigate({ name: OnboardingScreens.Security, params, merge: true })
    }
  }

  const onPressNext = (): void => {
    navigateToNextScreen()
  }

  const onPressEnableNotifications = (): void => {
    promptPushPermission(() => {
      addresses.forEach((address) =>
        dispatch(
          editAccountActions.trigger({
            type: EditAccountAction.TogglePushNotification,
            enabled: true,
            address,
          })
        )
      )
      navigateToNextScreen()
    }, showNotificationSettingsAlert)
  }

  return (
    <OnboardingScreen
      subtitle={t('Get notified when your transfers, swaps, and approvals complete.')}
      title={t('Turn on push notifications')}>
      <Flex centered shrink py="spacing60">
        <NotificationsBackgroundImage />
      </Flex>
      <Flex gap="spacing24">
        <TouchableArea
          eventName={SharedEventName.ELEMENT_CLICKED}
          name={ElementName.Skip}
          onPress={onPressNext}>
          <Text color="magentaVibrant" textAlign="center" variant="buttonLabelMedium">
            {t('Maybe later')}
          </Text>
        </TouchableArea>
        <Button
          eventName={SharedEventName.ELEMENT_CLICKED}
          label={t('Turn on notifications')}
          name={ElementName.Enable}
          onPress={onPressEnableNotifications}
        />
      </Flex>
    </OnboardingScreen>
  )
}

const NotificationsBackgroundImage = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()
  return (
    <Image
      source={isDarkMode ? ONBOARDING_NOTIFICATIONS_DARK : ONBOARDING_NOTIFICATIONS_LIGHT}
      style={styles.image}
    />
  )
}

const styles = StyleSheet.create({
  image: {
    height: '100%',
    resizeMode: 'contain',
  },
})
