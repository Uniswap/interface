import { useCallback } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'

export function useOnCloseSwapModal(): () => void {
  const appDispatch = useAppDispatch()

  const onClose = useCallback((): void => {
    appDispatch(closeModal({ name: ModalName.Swap }))
  }, [appDispatch])

  return onClose
}
