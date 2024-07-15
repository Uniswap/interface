import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { CloudBackupPassword } from 'src/features/CloudBackup/CloudBackupForm'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { Flex } from 'ui/src'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'

export type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.BackupCloudPasswordConfirm>

export function CloudBackupPasswordConfirmScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const { password } = params

  const navigateToNextScreen = useCallback((): void => {
    navigation.navigate({
      name: OnboardingScreens.BackupCloudProcessing,
      params,
      merge: true,
    })
  }, [navigation, params])

  return (
    <CloudBackupPassword.FormProvider
      isConfirmation
      navigateToNextScreen={navigateToNextScreen}
      passwordToConfirm={password}
    >
      <SafeKeyboardOnboardingScreen
        footer={
          <Flex mx="$spacing16" my="$spacing12">
            <CloudBackupPassword.ContinueButton />
          </Flex>
        }
        subtitle={t('onboarding.cloud.confirm.description')}
        title={t('onboarding.cloud.confirm.title')}
      >
        <CloudBackupPassword.PasswordInput />
      </SafeKeyboardOnboardingScreen>
    </CloudBackupPassword.FormProvider>
  )
}
