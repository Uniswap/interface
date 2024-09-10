import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { CloudBackupPassword } from 'src/features/CloudBackup/CloudBackupForm'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { Flex } from 'ui/src'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'

export type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.BackupCloudPasswordCreate>

export function CloudBackupPasswordCreateScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()

  const navigateToNextScreen = useCallback(
    ({ password }: { password: string }): void => {
      navigation.navigate({
        name: OnboardingScreens.BackupCloudPasswordConfirm,
        params: {
          ...params,
          password,
        },
        merge: true,
      })
    },
    [navigation, params],
  )

  return (
    <CloudBackupPassword.FormProvider navigateToNextScreen={navigateToNextScreen}>
      <SafeKeyboardOnboardingScreen
        footer={
          <Flex mx="$spacing16" my="$spacing12">
            <CloudBackupPassword.ContinueButton />
          </Flex>
        }
        subtitle={t('onboarding.cloud.createPassword.description')}
        title={t('onboarding.cloud.createPassword.title')}
      >
        <CloudBackupPassword.PasswordInput />
      </SafeKeyboardOnboardingScreen>
    </CloudBackupPassword.FormProvider>
  )
}
