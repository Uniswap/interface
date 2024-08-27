import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function useOnCloseSendModal(): () => void {
  const appDispatch = useDispatch()

  const onClose = useCallback((): void => {
    appDispatch(closeModal({ name: ModalName.Send }))
  }, [appDispatch])

  return onClose
}
