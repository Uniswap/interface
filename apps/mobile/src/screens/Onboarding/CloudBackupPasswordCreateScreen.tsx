import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { CloudBackupPassword } from 'src/features/CloudBackup/CloudBackupForm/CloudBackupPassword'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { Flex } from 'ui/src'
import { Cloud } from 'ui/src/components/icons'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'

export function CloudBackupPasswordCreateScreen({
  navigation,
  route: { params },
}: NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.BackupCloudPasswordCreate>): JSX.Element {
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
        Icon={Cloud}
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
