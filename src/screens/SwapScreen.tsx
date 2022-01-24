import { useHeaderHeight } from '@react-navigation/elements'
import { impactAsync } from 'expo-haptics'
import React, { useReducer, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { SwapNetworkModal } from 'src/components/swap/SwapNetworkModal'
import { ChainId } from 'src/constants/chains'
import { Header } from 'src/features/swap/Header'
import { useSwapActionHandlers } from 'src/features/swap/hooks'
import { SwapForm } from 'src/features/swap/SwapForm'
import {
  CurrencyField,
  initialSwapFormState,
  swapFormReducer,
} from 'src/features/swap/swapFormSlice'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'

export function SwapScreen({ route, navigation }: AppStackScreenProp<Screens.Swap>) {
  const [state, dispatch] = useReducer(
    swapFormReducer,
    route.params?.swapFormState || initialSwapFormState
  )

  const chainId = state[state.exactCurrencyField]?.chainId
  const headerHeight = useHeaderHeight()
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const onCloseNetworkModal = () => setShowNetworkModal(false)

  const { onSelectCurrency } = useSwapActionHandlers(dispatch)

  const setChainId = (newChainId: ChainId) => {
    onSelectCurrency(CurrencyField.INPUT, NativeCurrency.onChain(newChainId))
  }

  return (
    <SheetScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight + 70}
        style={flex.fill}>
        <ScrollView keyboardShouldPersistTaps="always">
          <Header
            chainId={chainId}
            onPressBack={() => navigation.goBack()}
            onPressNetwork={() => {
              impactAsync()
              setShowNetworkModal(true)
            }}
          />
          <SwapForm dispatch={dispatch} state={state} />
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomSheetModal isVisible={showNetworkModal} onClose={onCloseNetworkModal}>
        <SwapNetworkModal
          chainId={chainId}
          setChainId={setChainId}
          onPressClose={onCloseNetworkModal}
        />
      </BottomSheetModal>
    </SheetScreen>
  )
}
