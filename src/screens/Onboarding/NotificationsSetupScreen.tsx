import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, StyleSheet } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { i18n } from 'src/app/i18n'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Box, Flex } from 'src/components/layout'
import { useBiometricAppSettings } from 'src/features/biometrics/hooks'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { selectAccounts } from 'src/features/wallet/selectors'
import { OnboardingScreens } from 'src/screens/Screens'

import { openSettings } from 'src/utils/linking'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Notifications>

export const showNotificationSettingsAlert = () => {
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

export function NotificationsSetupScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const { requiredForTransactions: isBiometricAuthEnabled } = useBiometricAppSettings()
  const accounts = useAppSelector(selectAccounts)
  const dispatch = useAppDispatch()
  const addresses = Object.keys(accounts)

  const onPressNext = () => {
    navigateToNextScreen()
  }

  const onPressEnableNotifications = () => {
    promptPushPermission(() => {
      addresses.forEach((address) =>
        dispatch(
          editAccountActions.trigger({
            type: EditAccountAction.TogglePushNotificationParams,
            enabled: true,
            address,
          })
        )
      )
      navigateToNextScreen()
    }, showNotificationSettingsAlert)
  }

  const navigateToNextScreen = () => {
    if (isBiometricAuthEnabled || params?.entryPoint === OnboardingEntryPoint.Sidebar) {
      navigation.navigate({ name: OnboardingScreens.Outro, params, merge: true })
    } else {
      navigation.navigate({ name: OnboardingScreens.Security, params, merge: true })
    }
  }

  return (
    <OnboardingScreen
      subtitle={t('Get notified when your transfers, swaps, and approvals complete.')}
      title={t('Turn on push notifications')}>
      <Flex grow justifyContent="space-between">
        <NotificationLinesWrapper />
        <Flex alignItems="center" gap="sm" justifyContent="flex-end" width="100%">
          <TextButton
            alignSelf="stretch"
            borderColor="backgroundOutline"
            borderRadius="lg"
            borderWidth={1}
            name={ElementName.Skip}
            px="md"
            py="md"
            testID={ElementName.Skip}
            textAlign="center"
            textColor="textPrimary"
            textVariant="mediumLabel"
            onPress={onPressNext}>
            {t('Maybe later')}
          </TextButton>

          <PrimaryButton
            alignSelf="stretch"
            label={t('Turn on notifications')}
            name={ElementName.Enable}
            testID={ElementName.Enable}
            textVariant="mediumLabel"
            variant="onboard"
            onPress={onPressEnableNotifications}
          />
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}

interface NotificationLineProps {
  active?: boolean
}

function NotificationLine({ active = true }: NotificationLineProps) {
  return (
    <Flex
      row
      alignItems="center"
      backgroundColor={active ? 'textTertiary' : 'textPrimary'}
      gap="xxs"
      px="xs"
      style={styles.lineWrapper}>
      <Box backgroundColor="backgroundBackdrop" height={10} style={styles.rectangle} width={10} />
      <Box backgroundColor="backgroundBackdrop" borderRadius="xs" flex={1} height={5} />
    </Flex>
  )
}

function NotificationLinesWrapper() {
  return (
    <Flex centered grow>
      <Flex
        borderColor="textTertiary"
        borderWidth={4}
        gap="xs"
        px="sm"
        style={styles.notifLinesWrapper}
        width={123}>
        <NotificationLine active={false} />
        <NotificationLine />
        <NotificationLine />
      </Flex>
    </Flex>
  )
}

const styles = StyleSheet.create({
  lineWrapper: {
    borderRadius: 6,
    paddingBottom: 5,
    paddingTop: 6,
  },
  notifLinesWrapper: {
    borderRadius: 24,
    paddingBottom: 53,
    paddingTop: 90,
  },
  rectangle: {
    borderRadius: 3,
  },
})
