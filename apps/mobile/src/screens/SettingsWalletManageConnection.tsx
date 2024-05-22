import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { ConnectedDappsList } from 'src/components/WalletConnect/ConnectedDapps/ConnectedDappsList'
import { Screen } from 'src/components/layout/Screen'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { Screens } from './Screens'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsWalletManageConnection>

export function SettingsWalletManageConnection({
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { sessions } = useWalletConnect(address)

  return (
    <Screen>
      <ConnectedDappsList sessions={sessions} />
    </Screen>
  )
}
