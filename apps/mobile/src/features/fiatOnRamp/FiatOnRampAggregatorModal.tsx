import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { FiatOnRampStackNavigator } from 'src/app/navigation/navigation'
import { closeModal } from 'src/features/modals/modalSlice'
import { useSporeColors } from 'ui/src'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function FiatOnRampAggregatorModal(): JSX.Element {
  const colors = useSporeColors()

  const dispatch = useDispatch()
  const onClose = useCallback((): void => {
    dispatch(closeModal({ name: ModalName.FiatOnRampAggregator }))
  }, [dispatch])

  return (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      hideKeyboardOnDismiss
      renderBehindTopInset
      backgroundColor={colors.surface1.get()}
      name={ModalName.FiatOnRampAggregator}
      onClose={onClose}
    >
      <FiatOnRampStackNavigator />
    </BottomSheetModal>
  )
}
