import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { ModalName } from 'src/features/telemetry/constants'
import { TransferFlow as TransferFlowRewrite } from 'src/features/transactions/swapRewrite/transfer/TransferFlow'
import { TransferFlow } from 'src/features/transactions/transfer/TransferFlow'
import { useSporeColors } from 'ui/src'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'

export function TransferTokenModal(): JSX.Element {
  const colors = useSporeColors()
  const appDispatch = useAppDispatch()
  const modalState = useAppSelector(selectModalState(ModalName.Send))

  const onClose = useCallback((): void => {
    appDispatch(closeModal({ name: ModalName.Send }))
  }, [appDispatch])

  const isSendRewriteEnabled = useFeatureFlag(FEATURE_FLAGS.SendRewrite)

  return isSendRewriteEnabled ? (
    <TransferFlowRewrite />
  ) : (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      hideKeyboardOnDismiss
      renderBehindTopInset
      backgroundColor={colors.surface1.get()}
      name={ModalName.Send}
      onClose={onClose}>
      <TransferFlow prefilledState={modalState.initialState} onClose={onClose} />
    </BottomSheetModal>
  )
}
