import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { CloudBackupProcessingAnimation } from 'src/features/CloudBackup/CloudBackupProcessingAnimation'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.BackupCloudProcessing
>

/** Screen to perform secure recovery phrase backup to Cloud  */
export function CloudBackupProcessingScreen({
  navigation,
  route: {
    params: { password, importType, entryPoint, address, unitagClaim },
  },
}: Props): JSX.Element | null {
  const onBackupComplete = (): void => {
    navigation.navigate({
      name: OnboardingScreens.Notifications,
      params: { importType, entryPoint, unitagClaim },
      merge: true,
    })
  }

  const onErrorPress = (): void => {
    navigation.navigate({
      name: OnboardingScreens.Backup,
      params: { importType, entryPoint, unitagClaim },
      merge: true,
    })
  }

  return (
    <Screen>
      <CloudBackupProcessingAnimation
        accountAddress={address}
        navigation={navigation}
        password={password}
        onBackupComplete={onBackupComplete}
        onErrorPress={onErrorPress}
      />
    </Screen>
  )
}
