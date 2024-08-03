import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector } from 'src/app/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { TransferFlow } from 'src/features/transactions/transfer/TransferFlow'
import { TransferFlow as TransferFlowRewrite } from 'src/features/transactions/transfer/transferRewrite/TransferFlow'
import { useSporeColors } from 'ui/src'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function TransferTokenModal(): JSX.Element {
  const colors = useSporeColors()
  const appDispatch = useDispatch()
  const modalState = useAppSelector(selectModalState(ModalName.Send))

  const onClose = useCallback((): void => {
    appDispatch(closeModal({ name: ModalName.Send }))
  }, [appDispatch])

  const isSendRewriteEnabled = useFeatureFlag(FeatureFlags.SendRewrite)

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
      onClose={onClose}
    >
      <TransferFlow prefilledState={modalState.initialState} onClose={onClose} />
    </BottomSheetModal>
  )
}
