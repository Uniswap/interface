import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal, selectModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { TransferFlow } from 'src/features/transactions/transfer/TransferFlow'
import { useSporeColors } from 'ui/src'

export function TransferTokenModal(): JSX.Element {
  const colors = useSporeColors()
  const appDispatch = useAppDispatch()
  const modalState = useAppSelector(selectModalState(ModalName.Send))

  const onClose = useCallback((): void => {
    appDispatch(closeModal({ name: ModalName.Send }))
  }, [appDispatch])

  return (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      hideKeyboardOnDismiss
      renderBehindInset
      backgroundColor={colors.surface1.val}
      name={ModalName.Send}
      onClose={onClose}>
      <TransferFlow prefilledState={modalState.initialState} onClose={onClose} />
    </BottomSheetModal>
  )
}
