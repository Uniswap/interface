import { selectionAsync } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import ScanQRIcon from 'src/assets/icons/scan-qr.svg'
import { Button } from 'src/components/buttons/Button'
import { WalletConnectModalState } from 'src/components/WalletConnect/constants'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'

export function QRScannerIconButton({ size = 24 }: { size?: number }) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const onPressScan = useCallback(() => {
    selectionAsync()
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: WalletConnectModalState.ScanQr })
    )
  }, [dispatch])

  return (
    <Button name={ElementName.WalletConnectScan} onPress={onPressScan}>
      <ScanQRIcon color={theme.colors.textSecondary} height={size} width={size} />
    </Button>
  )
}
