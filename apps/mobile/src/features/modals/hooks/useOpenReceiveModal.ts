import { useDispatch } from 'react-redux'
import { openModal } from 'src/features/modals/modalSlice'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'

export function useOpenReceiveModal(): () => void {
  const dispatch = useDispatch()
  const cexTransferProviders = useCexTransferProviders()

  const modalToOpen =
    cexTransferProviders.length > 0
      ? { name: ModalName.ReceiveCryptoModal, initialState: cexTransferProviders }
      : { name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr }

  return () => {
    dispatch(openModal(modalToOpen))
  }
}
