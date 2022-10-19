import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { CloudBackupSetPassword } from 'src/features/onboarding/CloudBackupSetPassword'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'

export type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.BackupCloudPassword
>

export function CloudBackupPasswordScreen({ navigation }: Props) {
  const { t } = useTranslation()

  const onPressNext = (password: string) => {
    navigation.navigate({
      name: OnboardingScreens.BackupCloudProcessing,
      params: {
        password: password,
      },
      merge: true,
    })
  }

  return (
    <OnboardingScreen
      keyboardAvoidingViewEnabled={false}
      subtitle={t(
        'Setting a password will encrypt your recovery phrase backup, adding an extra level of protection if your iCloud account is ever compromised.'
      )}
      title={t('Create your backup password')}>
      <CloudBackupSetPassword doneButtonText={t('Continue')} onPressDone={onPressNext} />
    </OnboardingScreen>
  )
}
