import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { ExchangeTransferConnecting } from 'src/screens/ExchangeTransferConnecting'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function ExchangeTransferModal(): JSX.Element | null {
  const dispatch = useDispatch()
  const onClose = (): void => {
    dispatch(closeModal({ name: ModalName.ExchangeTransferModal }))
  }

  const { initialState } = useSelector(selectModalState(ModalName.ExchangeTransferModal))
  const serviceProvider = initialState?.serviceProvider

  return serviceProvider ? (
    <Modal
      fullScreen
      hideHandlebar
      hideKeyboardOnDismiss
      renderBehindTopInset
      name={ModalName.ExchangeTransferModal}
      onClose={onClose}
    >
      <ExchangeTransferConnecting serviceProvider={serviceProvider} onClose={onClose} />
    </Modal>
  ) : null
}
