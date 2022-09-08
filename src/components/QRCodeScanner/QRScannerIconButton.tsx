import { selectionAsync } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useAppTheme } from 'src/app/hooks'
import ScanQRIcon from 'src/assets/icons/scan-qr.svg'
import { Button } from 'src/components/buttons/Button'
import { ElementName } from 'src/features/telemetry/constants'

export function QRScannerIconButton({
  size = 24,
  onPress,
}: {
  size?: number
  onPress: () => void
}) {
  const theme = useAppTheme()

  const onPressScan = useCallback(() => {
    selectionAsync()
    onPress()
  }, [onPress])

  return (
    <Button name={ElementName.WalletConnectScan} onPress={onPressScan}>
      <ScanQRIcon color={theme.colors.textSecondary} height={size} width={size} />
    </Button>
  )
}
