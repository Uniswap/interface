import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { CloudBackupProcessingAnimation } from 'src/features/CloudBackup/CloudBackupProcessingAnimation'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

type Props = NativeStackScreenProps<SettingsStackParamList, MobileScreens.SettingsCloudBackupProcessing>

export function SettingsCloudBackupProcessingScreen({
  navigation,
  route: {
    params: { address, password },
  },
}: Props): JSX.Element | null {
  const onBackupComplete = (): void => {
    // Reset the stack to remove password screens, keeping only Settings as the base
    navigation.reset({
      index: 1,
      routes: [
        { name: MobileScreens.Settings },
        { name: MobileScreens.SettingsCloudBackupStatus, params: { address } },
      ],
    })
  }

  const onErrorPress = (): void => {
    navigation.popToTop()
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
