import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { ChainId } from 'src/constants/chains'
import { NotificationToast } from 'src/features/notifications/NotificationToast'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { AppNotification, AppNotificationType } from 'src/features/notifications/types'
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
            textVariant="buttonLabel"
            onPress={onPressNext}>
            {t('Skip for now')}
          </TextButton>
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}

function SampleNotification({ value }: { value: AppNotification }) {
  return <NotificationToast appNotification={value} onPress={() => {}} />
}

function SampleNotifications() {
  const { t } = useTranslation()

  const sampleNotifications: AppNotification[] = useMemo(
    () => [
      {
        type: AppNotificationType.WalletConnect,
        title: t('Send or receive assets'),
        imageUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/dapps/aave.com.png',
        chainId: ChainId.ArbitrumOne.toString(),
      },
      {
        type: AppNotificationType.WalletConnect,
        title: t('Connected to {{dappName}}', { dappName: 'Uniswap' }),
        imageUrl: 'https://app.uniswap.org/images/192x192_App_Icon.png',
        chainId: ChainId.Mainnet.toString(),
      },
      {
        type: AppNotificationType.WalletConnect,
        title: t('Approve tokens for use with apps'),
        imageUrl:
          'https://raw.githubusercontent.com/trustwallet/assets/master/dapps/app.compound.finance.png',
        chainId: ChainId.Polygon.toString(),
      },
    ],
    [t]
  )

  return (
    <Flex>
      {sampleNotifications.map((s, i) => (
        <SampleNotification key={i} value={s} />
      ))}
    </Flex>
  )
}
