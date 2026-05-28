import { DataApiOutageModalContent } from 'uniswap/src/features/dataApi/outage/DataApiOutageModalContent'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useModalState } from '~/hooks/useModalState'
import { DataApiOutageModalParams } from '~/state/application/reducer'
import { useAppSelector } from '~/state/hooks'

export function DataApiOutageModal(): JSX.Element | null {
  const { isOpen, onClose } = useModalState(ModalName.DataApiOutage)

  const modalState = useAppSelector(
    (state) => (state.application.openModal as DataApiOutageModalParams | null)?.initialState,
  )

  if (!isOpen) {
    return null
  }

  return <DataApiOutageModalContent isOpen={isOpen} lastUpdatedAt={modalState?.dataUpdatedAt} onClose={onClose} />
}

export default DataApiOutageModal
