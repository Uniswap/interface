import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal, selectModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { SwapFlow } from 'src/features/transactions/swap/SwapFlow'

export function SwapModal(): JSX.Element {
  const theme = useAppTheme()
  const appDispatch = useAppDispatch()
  const modalState = useAppSelector(selectModalState(ModalName.Swap))

  const onClose = useCallback((): void => {
    appDispatch(closeModal({ name: ModalName.Swap }))
  }, [appDispatch])

  return (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      hideKeyboardOnDismiss
      renderBehindInset
      backgroundColor={theme.colors.surface1}
      name={ModalName.Swap}
      onClose={onClose}>
      <SwapFlow prefilledState={modalState.initialState} onClose={onClose} />
    </BottomSheetModal>
  )
}
