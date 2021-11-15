import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import { Switch } from 'src/components/buttons/Switch'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'

type Props = NativeStackScreenProps<RootStackParamList, Screens.SwapConfig>

export function SwapConfigScreen({}: Props) {
  // TODO this will be the where the fees + settings for swaps live
  // Just setting up some components for now
  const [expertMode, setExpertMode] = useState(false)

  return (
    <Screen>
      <Box alignItems="center" justifyContent="center">
        <Box
          alignItems="center"
          justifyContent="space-between"
          flexDirection="row"
          width="100%"
          px="md">
          <Text variant="body">Expert Mode</Text>
          <Switch value={expertMode} onValueChange={setExpertMode} />
        </Box>
      </Box>
    </Screen>
  )
}
