import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { SwapForm } from 'src/features/swap/SwapForm'

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
