import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { SettingsStackParamList, useSettingsStackNavigation } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { Screens } from './Screens'
import { ConnectedDappsList } from 'src/components/WalletConnect/ConnectedDapps/ConnectedDappsList'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsWalletManageConnection>

export function SettingsWalletManageConnection({
  route: {
    params: { address },
  },
}: Props) {
  const { sessions } = useWalletConnect(address)
  const navigation = useSettingsStackNavigation()

  const goBack = () => {
    navigation.goBack()
  }

  return (
    <Screen>
      <ConnectedDappsList goBack={goBack} sessions={sessions} />
    </Screen>
  )
}
