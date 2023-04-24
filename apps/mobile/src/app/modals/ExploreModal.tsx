import React from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { ExploreStackNavigator } from 'src/app/navigation/navigation'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'

export function ExploreModal(): JSX.Element {
  const theme = useAppTheme()
  const appDispatch = useAppDispatch()

  const onClose = (): void => {
    appDispatch(closeModal({ name: ModalName.Explore }))
  }

  return (
    <BottomSheetModal
      blurredBackground
      fullScreen
      hideKeyboardOnDismiss
      backgroundColor={theme.colors.none}
      hideHandlebar={true}
      name={ModalName.Explore}
      renderBehindInset={true}
      onClose={onClose}>
      <ExploreStackNavigator />
    </BottomSheetModal>
  )
}
