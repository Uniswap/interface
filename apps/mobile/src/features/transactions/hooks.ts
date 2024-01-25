import { useCallback } from 'react'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { useFiatOnRampIpAddressQuery } from 'wallet/src/features/fiatOnRamp/api'
import { useAppDispatch } from 'wallet/src/state'
import { ModalName } from 'wallet/src/telemetry/constants'

export function useOnSendEmptyActionPress(onClose: () => void): () => void {
  const { data } = useFiatOnRampIpAddressQuery()
  const dispatch = useAppDispatch()
  const fiatOnRampEligible = Boolean(data?.isBuyAllowed)

  return useCallback((): void => {
    onClose()
    dispatch(closeModal({ name: ModalName.Send }))
    if (fiatOnRampEligible) {
      dispatch(openModal({ name: ModalName.FiatOnRamp }))
    } else {
      dispatch(
        openModal({
          name: ModalName.WalletConnectScan,
          initialState: ScannerModalState.WalletQr,
        })
      )
    }
  }, [dispatch, fiatOnRampEligible, onClose])
}
