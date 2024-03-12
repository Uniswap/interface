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
      subtitle={t(
        'You’ll need to enter this password to recover your account. It’s not stored anywhere, so it can’t be recovered by anyone else.'
      )}
      title={t('Confirm your backup password')}>
      <CloudBackupPasswordForm
        isConfirmation={true}
        navigateToNextScreen={navigateToNextScreen}
        passwordToConfirm={password}
      />
    </SafeKeyboardOnboardingScreen>
  )
}
