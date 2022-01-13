import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { useHeaderHeight } from '@react-navigation/elements'
import { impactAsync } from 'expo-haptics'
import React, { useReducer, useRef } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { SheetScreen } from 'src/components/layout/SheetScreen'
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
import { bottomSheetStyles, BOTTOM_THIRD_SNAP_POINTS } from 'src/styles/bottomSheet'
import { flex } from 'src/styles/flex'

export function SwapScreen({ route, navigation }: AppStackScreenProp<Screens.Swap>) {
  const [state, dispatch] = useReducer(
    swapFormReducer,
    route.params?.swapFormState || initialSwapFormState
  )

  const chainId = state[state.exactCurrencyField]?.chainId
  const headerHeight = useHeaderHeight()

  const swapNetworkModalRef = useRef<BottomSheetModal>(null)

  const { onSelectCurrency } = useSwapActionHandlers(dispatch)

  const setChainId = (newChainId: ChainId) => {
    onSelectCurrency(CurrencyField.INPUT, NativeCurrency.onChain(newChainId))
  }

  return (
    <SheetScreen>
      <BottomSheetModalProvider>
        <KeyboardAvoidingView
          keyboardVerticalOffset={headerHeight + 70}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={flex.fill}>
          <Header
            chainId={chainId}
            onPressNetwork={() => {
              impactAsync()
              swapNetworkModalRef.current?.present()
            }}
            onPressBack={() => navigation.goBack()}
          />
          <SwapForm state={state} dispatch={dispatch} />
        </KeyboardAvoidingView>
        <BottomSheetModal
          ref={swapNetworkModalRef}
          index={0}
          snapPoints={BOTTOM_THIRD_SNAP_POINTS}
          style={bottomSheetStyles.bottomSheet}>
          <SwapNetworkModal
            onPressClose={() => {
              swapNetworkModalRef.current?.dismiss()
            }}
            chainId={chainId}
            setChainId={setChainId}
          />
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </SheetScreen>
  )
}
