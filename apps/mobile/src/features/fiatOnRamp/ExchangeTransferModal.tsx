import { useDispatch } from 'react-redux'
import { useAppSelector } from 'src/app/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { ExchangeTransferConnecting } from 'src/screens/ExchangeTransferConnecting'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function ExchangeTransferModal(): JSX.Element | null {
  const dispatch = useDispatch()
  const onClose = (): void => {
    dispatch(closeModal({ name: ModalName.ExchangeTransferModal }))
  }

  const { initialState } = useAppSelector(selectModalState(ModalName.ExchangeTransferModal))
  const serviceProvider = initialState?.serviceProvider

  return serviceProvider ? (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      hideKeyboardOnDismiss
      renderBehindTopInset
      name={ModalName.ExchangeTransferModal}
      onClose={onClose}
    >
      <ExchangeTransferConnecting serviceProvider={serviceProvider} onClose={onClose} />
    </BottomSheetModal>
  ) : null
}
