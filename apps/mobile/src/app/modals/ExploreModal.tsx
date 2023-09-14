import React from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { ExploreStackNavigator } from 'src/app/navigation/navigation'
import { ExploreStackParamList } from 'src/app/navigation/types'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { useSporeColors } from 'ui/src'

type InnerExploreStackParamList = Omit<ExploreStackParamList, Screens.Explore>

// The ExploreModalState allows a Screen and its Params to be defined, except for the initial Explore screen.
// This workaround facilitates navigation to any screen within the ExploreStack from outside.
// Implementation of this lives inside screens/ExploreScreen
export type ExploreModalState = {
  [V in keyof InnerExploreStackParamList]: { screen: V; params: InnerExploreStackParamList[V] }
}[keyof InnerExploreStackParamList]

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
      backgroundColor={colors.transparent.val}
      // Don't dismiss on back press, as this modal is used for the ExploreStack navigation.
      // (the modal should be dismissed only when the user navigates to the initial Explore screen)
      dismissOnBackPress={false}
      hideHandlebar={true}
      name={ModalName.Explore}
      renderBehindInset={true}
      onClose={onClose}>
      <ExploreStackNavigator />
    </BottomSheetModal>
  )
}
