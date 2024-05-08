import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { CloudBackupPasswordForm } from 'src/features/CloudBackup/CloudBackupPasswordForm'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'

export type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.BackupCloudPasswordConfirm
>

export function CloudBackupPasswordConfirmScreen({
  navigation,
  route: { params },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const { password } = params

  const navigateToNextScreen = (): void => {
    navigation.navigate({
      name: OnboardingScreens.BackupCloudProcessing,
      params,
      merge: true,
    })
  }

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={t('onboarding.cloud.confirm.description')}
      title={t('onboarding.cloud.confirm.title')}>
      <CloudBackupPasswordForm
        isConfirmation={true}
        navigateToNextScreen={navigateToNextScreen}
        passwordToConfirm={password}
      />
    </SafeKeyboardOnboardingScreen>
  )
}
