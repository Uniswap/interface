import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { CloudBackupSetPassword } from 'src/features/onboarding/CloudBackupSetPassword'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'

export type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.BackupCloudPassword
>

export function CloudBackupPasswordScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()

  const onPressNext = (password: string): void => {
    navigation.navigate({
      name: OnboardingScreens.BackupCloudProcessing,
      params: {
        ...params,
        password,
      },
      merge: true,
    })
  }

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={t(
        'Setting a password will encrypt your recovery phrase backup. You’ll need to enter this when restoring your wallet.'
      )}
      title={t('Create your backup password')}>
      <CloudBackupSetPassword doneButtonText={t('Continue')} onPressDone={onPressNext} />
    </SafeKeyboardOnboardingScreen>
  )
}
