import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Button } from 'react-native'
import { RootStackParamList } from 'src/app/navTypes'
import { Screen } from 'src/components/layout/Screen'
import { TransferTokenForm } from 'src/features/transfer/TransferTokenForm'

type Props = NativeStackScreenProps<RootStackParamList, 'Transfer'>

export function TransferTokenScreen({ navigation }: Props) {
  const onClickBack = () => {
    navigation.goBack()
  }

  return (
    <Screen>
      <TransferTokenForm />
      <Button title="Back" onPress={onClickBack} />
    </Screen>
  )
}
