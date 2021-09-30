import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { RootStackParamList } from 'src/app/navTypes'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

export function HomeScreen({ navigation }: Props) {
  const onClickSend = () => {
    navigation.navigate('Transfer')
  }

  return (
    <Screen>
      <Box alignItems="center">
        <Text textAlign="center" mt="xl">
          Hi!
        </Text>
        <Button label="Send Tokens" onPress={onClickSend} mt="md" />
      </Box>
    </Screen>
  )
}
