import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { Button, Flex } from 'ui/src'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { WelcomeSplash } from 'wallet/src/features/onboarding/WelcomeSplash'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.WelcomeSplash>

export function WelcomeSplashScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const headerHeight = useHeaderHeight()

  const onContinue = useCallback(() => {
    navigation.navigate({
      name: OnboardingScreens.Notifications,
      params,
      merge: true,
    })
  }, [navigation, params])

  return (
    <OnboardingScreen disableGoBack={false}>
      <Flex fill pb={headerHeight}>
        <WelcomeSplash address={params.address} />
      </Flex>

      <Flex row>
        <Button size="large" variant="branded" onPress={onContinue}>
          {t('common.button.continue')}
        </Button>
      </Flex>
    </OnboardingScreen>
  )
}
