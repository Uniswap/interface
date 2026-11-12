import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { setOpenModal } from '~/state/application/reducer'
import { useAppDispatch } from '~/state/hooks'
import { ReceiveCryptoModalInitialState } from '~/types/receiveCryptoModal'

export function useOpenReceiveCryptoModal(state: ReceiveCryptoModalInitialState) {
  const dispatch = useAppDispatch()

  return useEvent(() =>
    dispatch(
      setOpenModal({
        name: ModalName.ReceiveCryptoModal,
        initialState: state,
      }),
    ),
  )
}
