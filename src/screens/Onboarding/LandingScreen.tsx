import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, useColorScheme } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { UNISWAP_LOGO } from 'src/assets'
import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { DevelopmentOnly } from 'src/components/DevelopmentOnly/DevelopmentOnly'
import { LandingBackground } from 'src/components/gradients/LandingBackground'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { setFinishedOnboarding } from 'src/features/wallet/walletSlice'
import { OnboardingScreens } from 'src/screens/Screens'
import { colors } from 'src/styles/color'

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

  // Explore is no longer in spec. Keeping for dev purposes.
  const onPressExplore = () => {
    dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    dispatch(createAccountActions.trigger())
    dispatch(pendingAccountActions.trigger(PendingAccountActions.ACTIVATE))
    dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
  }

  return (
    <Screen edges={['bottom']}>
      <LandingBackground />
      <Box flex={1} justifyContent="flex-end">
        <Box alignItems="center" flex={1} justifyContent="center" paddingTop="xxxl">
          <Image source={UNISWAP_LOGO} style={styles.logo} />
        </Box>
        <Flex centered gap="lg" mx="md" my="sm">
          <Box width="100%">
            <Button
              label={t('Create a wallet')}
              name={ElementName.OnboardingCreateWallet}
              onPress={onPressCreateWallet}
            />
          </Box>
          <TextButton
            name={ElementName.OnboardingImportWallet}
            testID={ElementName.OnboardingImportWallet}
            onPress={onPressImportWallet}>
            <Text
              style={{ color: isDarkMode ? colors.white : colors.magenta300 }}
              variant="buttonLabelMedium">
              {t('I already have a wallet')}
            </Text>
          </TextButton>
          <DevelopmentOnly>
            <TouchableArea
              flexDirection="row"
              justifyContent="center"
              name={ElementName.OnboardingExplore}
              pt="sm"
              testID={ElementName.OnboardingExplore}
              onPress={onPressExplore}>
              <Text variant="buttonLabelMicro">{t('Not ready? Try')}</Text>
              <Text color="accentAction" variant="buttonLabelMicro">
                {' '}
                {t('Exploring')}{' '}
              </Text>
              <Text variant="buttonLabelMicro">{t('first.')}</Text>
            </TouchableArea>
          </DevelopmentOnly>
        </Flex>
      </Box>
    </Screen>
  )
}

const styles = StyleSheet.create({
  logo: {
    height: 172,
    width: 160,
  },
})
