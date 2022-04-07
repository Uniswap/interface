import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'react-native-qrcode-svg'
import 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import WalletConnectLogo from 'src/assets/icons/walletconnect.svg'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { WalletQRCode } from 'src/components/modals/WalletQRCode'
import { Text } from 'src/components/Text'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { QRCodeScanner } from 'src/features/walletConnect/QRCodeScanner'
import { connectToApp } from 'src/features/walletConnect/WalletConnect'
import { dimensions } from 'src/styles/sizing'
import { shortenAddress } from 'src/utils/addresses'

type Props = {
  isVisible: boolean
  onClose: () => void
}

export function WalletConnectScanSheet({ isVisible, onClose }: Props) {
  const { t } = useTranslation()
  const activeAccount = useActiveAccount()
  const [showQRModal, setShowQRModal] = useState(false)

  const onPressQRCode = () => setShowQRModal(true)
  const onCloseQrCode = () => setShowQRModal(false)
  const theme = useAppTheme()

  const onScanCode = (uri: string) => {
    if (!activeAccount) return

    connectToApp(uri, activeAccount.address)
    onClose()
  }

  if (!activeAccount) return null

  return (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      isVisible={isVisible}
      name={ModalName.WalletConnectScan}
      onClose={onClose}>
      <WalletQRCode
        address={activeAccount.address}
        isVisible={showQRModal}
        onClose={onCloseQrCode}
      />
      <Box flex={1}>
        <Flex
          row
          alignItems="center"
          gap="none"
          justifyContent="space-between"
          padding="lg"
          position="absolute"
          width={dimensions.fullWidth}
          zIndex="modal">
          <Button onPress={onClose}>
            <Chevron color={theme.colors.textColor} direction="w" height="18" width="18" />
          </Button>
          <Flex centered row gap="xs">
            <WalletConnectLogo height={30} width={30} />
            <Text variant="bodyLgBold">WalletConnect</Text>
          </Flex>
          {/* Render empty box here so second component can be centered */}
          <Box width={18} />
        </Flex>
        <QRCodeScanner onScanCode={onScanCode} />
      </Box>
      <Box paddingBottom="xl">
        <Button
          backgroundColor="gray100"
          borderRadius="lg"
          margin="md"
          name={ElementName.QRCodeModalToggle}
          padding="md"
          onPress={onPressQRCode}>
          <Flex row gap="sm">
            <Flex centered backgroundColor="white" borderRadius="sm" padding="xs">
              <QRCode size={35} value={activeAccount.address} />
            </Flex>
            <Flex flexGrow={1} gap="xs">
              <Text variant="bodyBold">{t('Show my QR code')}</Text>
              <Text variant="bodySmSoft">{shortenAddress(activeAccount.address)}</Text>
            </Flex>
            <Chevron color={theme.colors.textColor} direction="e" height="20" width="10" />
          </Flex>
        </Button>
      </Box>
    </BottomSheetModal>
  )
}
