import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { TransferFlow } from 'src/features/transactions/transfer/TransferFlow'
import { TransferFlow as TransferFlowRewrite } from 'src/features/transactions/transfer/transferRewrite/TransferFlow'
import { useSporeColors } from 'ui/src'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { ModalName } from 'wallet/src/telemetry/constants'

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
      overrideInnerContainer
      renderBehindTopInset
      backgroundColor={colors.surface1.get()}
      name={ModalName.Send}
      onClose={onClose}>
      <TransferFlow prefilledState={modalState.initialState} onClose={onClose} />
    </BottomSheetModal>
  )
}
