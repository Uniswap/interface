import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, View } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { UNISWAP_SPLASH_LOGO } from 'src/assets'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { RainbowLinearGradientStops } from 'src/components/gradients'
import { LinearGradientBox } from 'src/components/gradients/LinearGradient'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import { selectActiveAccount } from 'src/features/wallet/selectors'
import { setFinishedOnboarding } from 'src/features/wallet/walletSlice'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Landing>

export function LandingScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()

  const { t } = useTranslation()

  const onPressCreateWallet = () => {
    navigation.navigate(OnboardingScreens.EditName)
  }
  const onPressImportWallet = () => {
    navigation.navigate(OnboardingScreens.ImportMethod)
  }
  const onPressExplore = () => {
    // TODO Build any tooltips/guides for "explore"
    dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
  }

  // avoids `useActiveAccount` since response may be null
  const activeAccount = useAppSelector(selectActiveAccount)

  // create account on mount
  useEffect(() => {
    if (!activeAccount) {
      dispatch(createAccountActions.trigger(0))
    }
  }, [activeAccount, dispatch])

  return (
    <Screen edges={['bottom']}>
      <Box flex={1} justifyContent="flex-end">
        <Box alignItems="center" flex={1} justifyContent="center">
          <Box>
            <LinearGradientBox radius="xl" stops={RainbowLinearGradientStops}>
              <View style={styles.padded}>
                <Box bg="neutralBackground" borderRadius="xl">
                  <Image source={UNISWAP_SPLASH_LOGO} />
                </Box>
              </View>
            </LinearGradientBox>
          </Box>
        </Box>
        <Flex centered gap="lg" mx="md" my="sm">
          <PrimaryButton
            flexGrow={1}
            label={t('Create a wallet')}
            name={ElementName.OnboardingCreateWallet}
            testID={ElementName.OnboardingCreateWallet}
            variant="onboard"
            width="100%"
            onPress={onPressCreateWallet}
          />
          <TextButton
            name={ElementName.OnboardingImportWallet}
            testID={ElementName.OnboardingImportWallet}
            onPress={onPressImportWallet}>
            <Text color="deprecated_textColor" variant="mediumLabel">
              {t('I Already Have a Wallet')}
            </Text>
          </TextButton>
          <Button
            flexDirection="row"
            justifyContent="center"
            name={ElementName.OnboardingExplore}
            pt="sm"
            testID={ElementName.OnboardingExplore}
            onPress={onPressExplore}>
            <Text variant="caption">{t('Not ready? Try')}</Text>
            <Text color="deprecated_purple" variant="caption">
              {' '}
              {t('Exploring')}{' '}
            </Text>
            <Text variant="caption">{t('first.')}</Text>
          </Button>
        </Flex>
      </Box>
    </Screen>
  )
}

const styles = StyleSheet.create({
  padded: { padding: 1 },
})
