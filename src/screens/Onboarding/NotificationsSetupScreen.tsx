import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { i18n } from 'src/app/i18n'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import DaiIcon from 'src/assets/icons/dai-icon.svg'
import EthIcon from 'src/assets/icons/eth-icon.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { ArrowCircle } from 'src/components/icons/ArrowCircle'
import { CheckmarkCircleSvg } from 'src/components/icons/CheckmarkCircleSvg'
import OverlayIcon from 'src/components/icons/OverlayIcon'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { NotificationContentProps } from 'src/features/notifications/NotificationToast'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useIsBiometricAuthEnabled } from 'src/features/wallet/hooks'
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
  const isBiometricAuthEnabled = useIsBiometricAuthEnabled()
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
      subtitle={t('Receive transaction status updates when you:')}
      title={t('Turn on push notifications')}>
      <Flex grow justifyContent="space-between">
        <SampleNotifications />
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
            textVariant="largeLabel"
            onPress={onPressNext}>
            {t('Maybe later')}
          </TextButton>

          <PrimaryButton
            alignSelf="stretch"
            label={t('Turn on notifications')}
            name={ElementName.Enable}
            testID={ElementName.Enable}
            textVariant="largeLabel"
            variant="onboard"
            onPress={onPressEnableNotifications}
          />
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}

function SampleNotifications() {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const sampleNotifications: NotificationContentProps[] = useMemo(
    () => [
      {
        title: t('Send or receive tokens or NFTs'),
        icon: (
          <Flex centered height={32} width={32}>
            <OverlayIcon
              icon={<EthIcon />}
              left={16}
              overlay={
                <ArrowCircle
                  fill={theme.colors.backgroundSurface}
                  stroke={theme.colors.accentSuccess}
                />
              }
              top={16}
            />
          </Flex>
        ),
      },
      {
        title: t('Swap tokens'),
        icon: (
          <Flex height={32} width={32}>
            <OverlayIcon icon={<EthIcon />} left="33.33%" overlay={<DaiIcon />} top="33.33%" />
          </Flex>
        ),
      },
      {
        title: t('Approve tokens for use with apps'),
        icon: (
          <Flex centered height={32} width={32}>
            <OverlayIcon
              icon={<EthIcon />}
              left={16}
              overlay={
                <CheckmarkCircleSvg
                  fill={theme.colors.backgroundSurface}
                  stroke={theme.colors.accentSuccess}
                />
              }
              top={16}
            />
          </Flex>
        ),
      },
    ],
    [t, theme]
  )

  return (
    <Flex gap="md">
      {sampleNotifications.map((value, i) => (
        <Flex
          key={i}
          row
          alignItems="center"
          backgroundColor="backgroundContainer"
          borderColor="backgroundOutline"
          borderRadius="md"
          borderWidth={1}
          gap="sm"
          px="md"
          py="sm">
          {value.icon}
          <Text variant="subhead">{value.title}</Text>
        </Flex>
      ))}
    </Flex>
  )
}
