import React from 'react'
import { useDispatch } from 'react-redux'
import { ExploreStackNavigator } from 'src/app/navigation/navigation'
import { closeModal } from 'src/features/modals/modalSlice'
import { useSporeColors } from 'ui/src'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function ExploreModal(): JSX.Element {
  const colors = useSporeColors()
  const appDispatch = useDispatch()

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
      hideHandlebar={true}
      name={ModalName.Explore}
      onClose={onClose}
    >
      <ExploreStackNavigator />
    </BottomSheetModal>
  )
}
