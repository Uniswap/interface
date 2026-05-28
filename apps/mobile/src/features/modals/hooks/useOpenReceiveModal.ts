import { useDispatch } from 'react-redux'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { openModal } from 'src/features/modals/modalSlice'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'

export function useOpenReceiveModal(): () => void {
  const dispatch = useDispatch()
  const navigation = useAppStackNavigation()
  const cexTransferProviders = useCexTransferProviders()

  return () => {
    cexTransferProviders.length > 0
      ? navigation.navigate(ModalName.ReceiveCryptoModal, { serviceProviders: cexTransferProviders })
      : dispatch(openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr }))
  }
}
