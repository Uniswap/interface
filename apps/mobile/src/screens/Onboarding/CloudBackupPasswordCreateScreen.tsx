import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { CloudBackupPasswordForm } from 'src/features/CloudBackup/CloudBackupPasswordForm'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'

export type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.BackupCloudPasswordCreate
>

export function CloudBackupPasswordCreateScreen({
  navigation,
  route: { params },
}: Props): JSX.Element {
  const { t } = useTranslation()

  const navigateToNextScreen = ({ password }: { password: string }): void => {
    navigation.navigate({
      name: OnboardingScreens.BackupCloudPasswordConfirm,
      params: {
        ...params,
        password,
      },
      merge: true,
    })
  }

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={t('onboarding.cloud.createPassword.description')}
      title={t('onboarding.cloud.createPassword.title')}>
      <CloudBackupPasswordForm navigateToNextScreen={navigateToNextScreen} />
    </SafeKeyboardOnboardingScreen>
  )
}
