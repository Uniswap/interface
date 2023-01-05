import React from 'react'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal, selectModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { SwapFlow } from 'src/features/transactions/swap/SwapFlow'

export function SwapModal() {
  const theme = useAppTheme()
  const appDispatch = useAppDispatch()
  const modalState = useAppSelector(selectModalState(ModalName.Swap))

  const onClose = () => {
    appDispatch(closeModal({ name: ModalName.Swap }))
  }

  if (!modalState.isOpen) return null

  return (
    <BottomSheetModal
      fullScreen
      backgroundColor={theme.colors.background1}
      name={ModalName.Swap}
      onClose={onClose}>
      <SwapFlow prefilledState={modalState.initialState} onClose={onClose} />
    </BottomSheetModal>
  )
}
