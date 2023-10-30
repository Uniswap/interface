import React from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { ExploreStackNavigator } from 'src/app/navigation/navigation'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useSporeColors } from 'ui/src'

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
