import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import ScanQRIconSimple from 'src/assets/icons/scan-qr-simple.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { ElementName } from 'src/features/telemetry/constants'

export function QRScannerIconButton({
  size = 24,
  onPress,
}: {
  size?: number
  onPress: () => void
}) {
  const theme = useAppTheme()

  return (
    <TouchableArea hapticFeedback name={ElementName.WalletConnectScan} onPress={onPress}>
      <ScanQRIconSimple color={theme.colors.textSecondary} height={size} width={size} />
    </TouchableArea>
  )
}
