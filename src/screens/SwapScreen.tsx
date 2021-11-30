import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useReducer } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { Screen } from 'src/components/layout/Screen'
import { Header } from 'src/features/swap/Header'
import { SwapForm } from 'src/features/swap/SwapForm'
import { initialSwapFormState, swapFormReducer } from 'src/features/swap/swapFormSlice'
import { RootStackParamList } from 'src/screens/navTypes'
import { Screens } from 'src/screens/src/app/navigation/navTypes'

type Props = NativeStackScreenProps<RootStackParamList, Screens.Swap>

export function SwapScreen({ navigation }: Props) {
  const [state, dispatch] = useReducer(swapFormReducer, initialSwapFormState)

  const chainId = state[state.exactCurrencyField]?.chainId

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <Header chainId={chainId} onPressBack={() => navigation.goBack()} />
        <SwapForm state={state} dispatch={dispatch} />
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    bg: 'red',
  },
})
