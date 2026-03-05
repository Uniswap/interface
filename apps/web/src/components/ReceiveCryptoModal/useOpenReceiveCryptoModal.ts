import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { ReceiveCryptoModalInitialState } from '~/components/ReceiveCryptoModal/types'
import { setOpenModal } from '~/state/application/reducer'
import { useAppDispatch } from '~/state/hooks'

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
