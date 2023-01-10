import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useResponsiveProp } from '@shopify/restyle'
import React, { ReactElement } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useColorScheme } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button, ButtonSize } from 'src/components/buttons/Button'
import { LandingBackground } from 'src/components/gradients/LandingBackground'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { uniswapUrls } from 'src/constants/urls'
import { ElementName } from 'src/features/telemetry/constants'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { OnboardingScreens } from 'src/screens/Screens'
import { openUri } from 'src/utils/linking'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Landing>

export function LandingScreen({ navigation }: Props): ReactElement {
  const dispatch = useAppDispatch()

  const { t } = useTranslation()
  const isDarkMode = useColorScheme() === 'dark'

  const onPressGetStarted = (): void => {
    dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    navigation.navigate(OnboardingScreens.ImportMethod)
  }

  const outerGap = useResponsiveProp({ xs: 'sm', sm: 'lg' })
  const buttonSize = useResponsiveProp({ xs: ButtonSize.Medium, sm: ButtonSize.Large })
  const pb = useResponsiveProp({ xs: 'sm', sm: 'none' })

  return (
    <Screen edges={['bottom']}>
      <Flex shrink height="100%" width="100%">
        <LandingBackground />
      </Flex>
      <Flex grow height="auto">
        <Flex gap={outerGap} justifyContent="flex-end">
          <Flex mx="md">
            <Button
              label={t('Get started')}
              name={ElementName.GetStarted}
              size={buttonSize}
              onPress={onPressGetStarted}
            />
          </Flex>
          <Box mx="lg" pb={pb}>
            <Text color="textTertiary" mx="xxs" textAlign="center" variant="buttonLabelMicro">
              <Trans t={t}>
                By continuing, I agree to the{' '}
                <Text
                  color={isDarkMode ? 'accentActive' : 'accentAction'}
                  variant="buttonLabelMicro"
                  onPress={(): Promise<void> => openUri(uniswapUrls.termsOfServiceUrl)}>
                  Terms of Service
                </Text>{' '}
                and consent to the{' '}
                <Text
                  color={isDarkMode ? 'accentActive' : 'accentAction'}
                  variant="buttonLabelMicro"
                  onPress={(): Promise<void> => openUri(uniswapUrls.privacyPolicyUrl)}>
                  Privacy Policy
                </Text>
                .
              </Trans>
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Screen>
  )
}
