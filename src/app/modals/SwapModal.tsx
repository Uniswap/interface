import { useHeaderHeight } from '@react-navigation/elements'
import React, { PropsWithChildren } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { Box } from 'src/components/layout'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal, selectSwapModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { SheetScreenHeader } from 'src/features/transactions/swap/SheetScreenHeader'
import { SwapFlow } from 'src/features/transactions/swap/SwapFlow'
import { TransactionState } from 'src/features/transactions/transactionState/transactionState'
import { flex } from 'src/styles/flex'

export function SwapModal() {
  const theme = useAppTheme()
  const appDispatch = useAppDispatch()
  const modalState = useAppSelector(selectSwapModalState)

  const onClose = () => {
    appDispatch(closeModal({ name: ModalName.Swap }))
  }

  if (!modalState.isOpen) return null

  return (
    <BottomSheetModal
      fullScreen
      backgroundColor={theme.colors.mainBackground}
      isVisible={modalState.isOpen}
      name={ModalName.Swap}
      onClose={onClose}>
      <SwapFlow prefilledState={modalState.initialState} onClose={onClose} />
    </BottomSheetModal>
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
