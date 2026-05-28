import { useCallback } from 'react'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { setOpenModal } from '~/state/application/reducer'
import { useAppDispatch } from '~/state/hooks'

export function useDataApiOutageModal({ dataUpdatedAt }: { dataUpdatedAt?: number }): {
  openOutageModal: () => void
} {
  const dispatch = useAppDispatch()

  const openOutageModal = useCallback(() => {
    dispatch(
      setOpenModal({
        name: ModalName.DataApiOutage,
        initialState: { dataUpdatedAt },
      }),
    )
  }, [dispatch, dataUpdatedAt])

  return { openOutageModal }
}
