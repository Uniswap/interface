import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { CloudBackupProcessingAnimation } from 'src/features/CloudBackup/CloudBackupProcessingAnimation'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsCloudBackupProcessing>

export function SettingsCloudBackupProcessingScreen({
  navigation,
  route: {
    params: { address, password },
  },
}: Props): JSX.Element | null {
  const onBackupComplete = (): void => {
    navigation.replace(Screens.SettingsCloudBackupStatus, { address })
  }

  const onErrorPress = (): void => {
    navigation.navigate(Screens.Settings)
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
