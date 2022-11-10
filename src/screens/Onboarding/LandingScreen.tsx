import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useColorScheme } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { LandingBackground } from 'src/components/gradients/LandingBackground'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { uniswapUrls } from 'src/constants/urls'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { OnboardingScreens } from 'src/screens/Screens'
import { colors } from 'src/styles/color'
import { openUri } from 'src/utils/linking'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Landing>

export function LandingScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()

  const { t } = useTranslation()
  const isDarkMode = useColorScheme() === 'dark'

  const onPressCreateWallet = () => {
    // Clear any existing pending accounts first.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    dispatch(createAccountActions.trigger())
    navigation.navigate({
      name: OnboardingScreens.EditName,
      params: { importType: ImportType.Create },
      merge: true,
    })
  }
  const onPressImportWallet = () => {
    dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    navigation.navigate(OnboardingScreens.ImportMethod)
  }

  return (
    <Screen edges={['bottom']}>
      <Flex shrink height="100%" width="100%">
        <LandingBackground />
      </Flex>
      <Flex grow height="auto">
        <Flex gap="lg" justifyContent="flex-end">
          <Flex gap="sm" mx="md">
            <Button
              label={t('Create a wallet')}
              name={ElementName.OnboardingCreateWallet}
              onPress={onPressCreateWallet}
            />
            <TouchableArea
              mx="lg"
              my="sm"
              name={ElementName.OnboardingImportWallet}
              testID={ElementName.OnboardingImportWallet}
              onPress={onPressImportWallet}>
              <Text
                style={{ color: isDarkMode ? colors.white : colors.magenta300 }}
                textAlign="center"
                variant="buttonLabelMedium">
                {t('I already have a wallet')}
              </Text>
            </TouchableArea>
          </Flex>
          <Box mx="lg">
            <Text color="textTertiary" mx="xxs" textAlign="center" variant="buttonLabelMicro">
              <Trans t={t}>
                By continuing, I agree to the{' '}
                <Text
                  color={isDarkMode ? 'accentActive' : 'accentAction'}
                  variant="buttonLabelMicro"
                  onPress={() => openUri(uniswapUrls.termsOfServiceUrl, true)}>
                  Terms of Service
                </Text>{' '}
                and consent to the{' '}
                <Text
                  color={isDarkMode ? 'accentActive' : 'accentAction'}
                  variant="buttonLabelMicro"
                  onPress={() => openUri(uniswapUrls.privacyPolicyUrl, true)}>
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
