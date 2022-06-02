import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import AaveIcon from 'src/assets/icons/aave-check.svg'
import DaiEthIcon from 'src/assets/icons/dai-eth.svg'
import EthIcon from 'src/assets/icons/eth-download.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Box, Flex } from 'src/components/layout'
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
      subtitle={t('Receive transaction status updates when you:')}
      title={t('Turn on push notifications')}>
      <Flex grow justifyContent="space-between">
        <SampleNotifications />
        <Flex alignItems="center" gap="xl" justifyContent="flex-end" width={'100%'}>
          <PrimaryButton
            alignSelf="stretch"
            label={t('Turn on notifications')}
            name={ElementName.Enable}
            testID={ElementName.Enable}
            variant="onboard"
            onPress={onPressEnableNotifications}
          />
          <TextButton
            name={ElementName.Skip}
            textColor="deprecated_textColor"
            textVariant="mediumLabel"
            onPress={onPressNext}>
            {t('Maybe later')}
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
        title: t('Send or receive tokens or NFTs'),
        icon: <EthIcon />,
      },
      {
        title: t('Swap tokens'),
        icon: <DaiEthIcon />,
      },
      {
        title: t('Approve tokens for use with apps'),
        icon: <AaveIcon />,
      },
    ],
    [t]
  )

  return (
    <Flex gap="md">
      {sampleNotifications.map((value, i) => (
        <Box backgroundColor="neutralSurface" borderRadius="lg" padding="sm">
          <NotificationContent key={i} icon={value.icon} title={value.title} />
        </Box>
      ))}
    </Flex>
  )
}
