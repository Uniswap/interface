import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal, selectModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { SwapFlow } from 'src/features/transactions/swap/SwapFlow'
import { useSporeColors } from 'ui/src'

export function SwapModal(): JSX.Element {
  const colors = useSporeColors()
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
      backgroundColor={colors.surface1.val}
      name={ModalName.Swap}
      onClose={onClose}>
      <SwapFlow prefilledState={modalState.initialState} onClose={onClose} />
    </BottomSheetModal>
  )
}
