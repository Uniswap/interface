import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Button, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RootStackParamList } from 'src/app/navTypes'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

export function HomeScreen({ navigation }: Props) {
  const onClickSend = () => {
    navigation.navigate('Transfer')
  }

  return (
    <SafeAreaView style={styles.contentContainer}>
      <Text>Hi!</Text>
      <Button title="Send Tokens" onPress={onClickSend} />
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
