import { useHeaderHeight } from '@react-navigation/elements'
import { AnyAction } from '@reduxjs/toolkit'
import { impactAsync } from 'expo-haptics'
import React, { PropsWithChildren, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { Box } from 'src/components/layout'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ChangeNetworkModal } from 'src/components/Network/ChangeNetworkModal'
import { ChainId } from 'src/constants/chains'
import { ModalName } from 'src/features/telemetry/constants'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { HeaderWithNetworkSelector } from 'src/features/transactions/swap/HeaderWithNetworkSelector'
import { useSwapActionHandlers } from 'src/features/transactions/swap/hooks'
import { SwapForm } from 'src/features/transactions/swap/SwapForm'
import {
  CurrencyField,
  initialState,
  TransactionState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'

export function SwapScreen({ route }: AppStackScreenProp<Screens.Swap>) {
  const [state, dispatch] = useReducer(
    transactionStateReducer,
    route.params?.swapFormState || initialState
  )

  const { t } = useTranslation()

  return (
    <SheetWithNetworkSelector dispatch={dispatch} label={t('Swap')} state={state}>
      <SwapForm dispatch={dispatch} state={state} />
    </SheetWithNetworkSelector>
  )
}

interface SheetWithNetworkSelectorProps {
  dispatch: React.Dispatch<AnyAction>
  label: string
  state: Readonly<TransactionState>
}

// TODO: export to new file once swapform reducer is finalized
export function SheetWithNetworkSelector({
  children,
  dispatch,
  label,
  state,
}: PropsWithChildren<SheetWithNetworkSelectorProps>) {
  const navigation = useAppStackNavigation()

  const headerHeight = useHeaderHeight()
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const onCloseNetworkModal = () => setShowNetworkModal(false)

  const chainId = state[state.exactCurrencyField]?.chainId
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
        <ScrollView contentContainerStyle={flex.grow} keyboardShouldPersistTaps="always">
          <Box flex={1}>
            <HeaderWithNetworkSelector
              chainId={chainId}
              label={label}
              onPressBack={() => navigation.goBack()}
              onPressNetwork={() => {
                impactAsync()
                setShowNetworkModal(true)
              }}
            />
            {children}
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomSheetModal
        isVisible={showNetworkModal}
        name={ModalName.NetworkSelector}
        onClose={onCloseNetworkModal}>
        <ChangeNetworkModal
          chainId={chainId}
          setChainId={setChainId}
          onPressClose={onCloseNetworkModal}
        />
      </BottomSheetModal>
    </SheetScreen>
  )
}
