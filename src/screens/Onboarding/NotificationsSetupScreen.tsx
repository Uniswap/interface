import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import {
  NotificationContent,
  NotificationContentProps,
} from 'src/features/notifications/NotificationToast'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Notifications>

export function NotificationsSetupScreen({ navigation }: Props) {
  const { t } = useTranslation()

  const onPressNext = () => {
    navigation.navigate(OnboardingScreens.Security)
  }

  const onPressEnableNotifications = () => {
    promptPushPermission(() => navigation.navigate(OnboardingScreens.Security))
  }

  return (
    <OnboardingScreen
      stepCount={4}
      stepNumber={2}
      subtitle={t('Stay up-to-date on the status of your transactions.')}
      title={t('Turn on push notifications')}>
      <Flex grow justifyContent="space-between">
        <SampleNotifications />

        <Flex alignItems="center" justifyContent="flex-end" width={'100%'}>
          <PrimaryButton
            alignSelf="stretch"
            label={t('Turn on notifications')}
            name={ElementName.Enable}
            testID={ElementName.Enable}
            onPress={onPressEnableNotifications}
          />
          <TextButton
            name={ElementName.Skip}
            textColor="deprecated_textColor"
            textVariant="mediumLabel"
            onPress={onPressNext}>
            {t('Skip for now')}
          </TextButton>
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}

function SampleNotifications() {
  const { t } = useTranslation()

  const sampleNotifications: NotificationContentProps[] = useMemo(
    () => [
      {
        title: t('Send or receive assets'),
      },
      {
        title: t('Connected to {{dappName}}', { dappName: 'Uniswap' }),
      },
      {
        title: t('Approve tokens for use with apps'),
      },
    ],
    [t]
  )

  return (
    <Flex>
      {sampleNotifications.map((value, i) => (
        <NotificationContent key={i} title={value.title} />
      ))}
    </Flex>
  )
}
