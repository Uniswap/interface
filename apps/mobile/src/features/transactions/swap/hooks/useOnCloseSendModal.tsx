import { useCallback } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function useOnCloseSendModal(): () => void {
  const appDispatch = useAppDispatch()

  const onClose = useCallback((): void => {
    appDispatch(closeModal({ name: ModalName.Send }))
  }, [appDispatch])

  return onClose
}
