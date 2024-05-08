import React, { useCallback } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { FiatOnRampStackNavigator } from 'src/app/navigation/navigation'
import { closeModal } from 'src/features/modals/modalSlice'
import { useSporeColors } from 'ui/src'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { ModalName } from 'wallet/src/telemetry/constants'

export function FiatOnRampAggregatorModal(): JSX.Element {
  const colors = useSporeColors()

  const dispatch = useAppDispatch()
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
      // Don't dismiss on back press, as this modal is used for the FiatOnRampStack navigation.
      // (the modal should be dismissed only when the user navigates to the initial FiatOnRamp screen)
      dismissOnBackPress={false}
      name={ModalName.FiatOnRampAggregator}
      onClose={onClose}>
      <FiatOnRampStackNavigator />
    </BottomSheetModal>
  )
}
