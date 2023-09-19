import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal, selectModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { SwapFlow } from 'src/features/transactions/swap/SwapFlow'
import { SwapFlow as SwapFlowRewrite } from 'src/features/transactions/swapRewrite/SwapFlow'
import { useSporeColors } from 'ui/src'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'

export function SwapModal(): JSX.Element {
  const colors = useSporeColors()
  const appDispatch = useAppDispatch()
  const modalState = useAppSelector(selectModalState(ModalName.Swap))

  const shouldShowSwapRewrite = useFeatureFlag(FEATURE_FLAGS.SwapRewrite)

  const onClose = useCallback((): void => {
    appDispatch(closeModal({ name: ModalName.Swap }))
  }, [appDispatch])

  return shouldShowSwapRewrite ? (
    <SwapFlowRewrite prefilledState={modalState.initialState} onClose={onClose} />
  ) : (
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
