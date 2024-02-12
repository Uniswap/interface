import React from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { ExploreStackNavigator } from 'src/app/navigation/navigation'
import { closeModal } from 'src/features/modals/modalSlice'
import { useSporeColors } from 'ui/src'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { ModalName } from 'wallet/src/telemetry/constants'

export function ExploreModal(): JSX.Element {
  const colors = useSporeColors()
  const appDispatch = useAppDispatch()

  const onClose = (): void => {
    appDispatch(closeModal({ name: ModalName.Explore }))
  }

  return (
    <BottomSheetModal
      blurredBackground
      fullScreen
      hideKeyboardOnDismiss
      renderBehindBottomInset
      renderBehindTopInset
      backgroundColor={colors.transparent.val}
      // Don't dismiss on back press, as this modal is used for the ExploreStack navigation.
      // (the modal should be dismissed only when the user navigates to the initial Explore screen)
      dismissOnBackPress={false}
      hideHandlebar={true}
      name={ModalName.Explore}
      onClose={onClose}>
      <ExploreStackNavigator />
    </BottomSheetModal>
  )
}
