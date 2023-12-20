import React, { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { ModalName } from 'src/features/telemetry/constants'
import { updateSwapStartTimestamp } from 'src/features/telemetry/timing/slice'
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

  // Update flow start timestamp every time modal is opened for logging
  useEffect(() => {
    appDispatch(updateSwapStartTimestamp({ timestamp: Date.now() }))
  }, [appDispatch])

  return shouldShowSwapRewrite ? (
    <SwapFlowRewrite />
  ) : (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      hideKeyboardOnDismiss
      renderBehindTopInset
      backgroundColor={colors.surface1.get()}
      name={ModalName.Swap}
      onClose={onClose}>
      <SwapFlow prefilledState={modalState.initialState} onClose={onClose} />
    </BottomSheetModal>
  )
}
