import { useEffect } from 'react'
import { BackHandler } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { useAppDispatch } from 'wallet/src/state'
import { ModalsState } from './ModalsState'
import { selectModalState } from './selectModalState'

/* This hook is used to close the globally available modals (in Redux store) when the 
back button is pressed. */
export function useReduxModalBackHandler(modalName: keyof ModalsState): void {
  const appDispatch = useAppDispatch()
  const isBottomSheetOpen = useAppSelector(selectModalState(modalName)).isOpen

  useEffect(() => {
    if (!isBottomSheetOpen) {
      return
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      appDispatch(closeModal({ name: modalName }))
      return true
    })

    return subscription.remove
  }, [isBottomSheetOpen, appDispatch, modalName])
}
