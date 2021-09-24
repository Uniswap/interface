import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Button, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RootStackParamList } from 'src/app/navTypes'
import { TransferTokenForm } from 'src/features/transfer/TransferTokenForm'

type Props = NativeStackScreenProps<RootStackParamList, 'Transfer'>

export function TransferTokenScreen({ navigation }: Props) {
  const onClickBack = () => {
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.contentContainer}>
      <TransferTokenForm />
      <Button title="Back" onPress={onClickBack} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
