import { useHeaderHeight } from '@react-navigation/elements'
import React, { PropsWithChildren, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { Box } from 'src/components/layout'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { SheetScreenHeader } from 'src/features/transactions/swap/SheetScreenHeader'
import { SwapForm } from 'src/features/transactions/swap/SwapForm'
import {
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
    <SheetScreenWithHeader label={t('Swap')} state={state}>
      <SwapForm dispatch={dispatch} state={state} />
    </SheetScreenWithHeader>
  )
}

interface SheetScreenWithHeaderProps {
  label: string
  state: Readonly<TransactionState>
}

// TODO: export to new file once swapform reducer is finalized
export function SheetScreenWithHeader({
  children,
  label,
  state,
}: PropsWithChildren<SheetScreenWithHeaderProps>) {
  const navigation = useAppStackNavigation()

  const headerHeight = useHeaderHeight()

  const chainId = state[state.exactCurrencyField]?.chainId

  return (
    <SheetScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight + 70}
        style={flex.fill}>
        <ScrollView contentContainerStyle={flex.grow} keyboardShouldPersistTaps="always">
          <Box flex={1}>
            <SheetScreenHeader
              chainId={chainId}
              label={label}
              onPressBack={() => navigation.goBack()}
            />
            {children}
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SheetScreen>
  )
}
