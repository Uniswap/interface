import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { SwapForm } from 'src/features/swap/SwapForm'
import { RootStackParamList } from 'src/screens/navTypes'
import { Screens } from 'src/screens/Screens'

// TODO: support exact out

type Props = NativeStackScreenProps<RootStackParamList, Screens.Swap>

export function SwapScreen(_props: Props) {
  return (
    <Screen>
      <ScrollView>
        <Box alignItems="center">
          <SwapForm />
        </Box>
      </ScrollView>
    </Screen>
  )
}
