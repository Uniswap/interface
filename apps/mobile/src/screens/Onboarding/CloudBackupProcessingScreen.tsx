import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { navigate } from 'src/app/navigation/rootNavigation'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { CloudBackupProcessingAnimation } from 'src/features/CloudBackup/CloudBackupProcessingAnimation'
import { OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.BackupCloudProcessing>

/** Screen to perform secure recovery phrase backup to Cloud  */
export function CloudBackupProcessingScreen({
  navigation,
  route: {
    params: { password, importType, entryPoint, address },
  },
}: Props): JSX.Element | null {
  const onBackupComplete = (): void => {
    if (entryPoint === OnboardingEntryPoint.BackupCard) {
      navigate(MobileScreens.Home)
    } else {
      navigation.navigate({
        name: OnboardingScreens.Notifications,
        params: { importType, entryPoint },
        merge: true,
      })
    }
  }

  const onErrorPress = (): void => {
    navigation.navigate({
      name: OnboardingScreens.Backup,
      params: { importType, entryPoint },
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
