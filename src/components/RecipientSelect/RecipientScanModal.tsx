import { selectionAsync } from 'expo-haptics'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-reanimated'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import Scan from 'src/assets/icons/qr-code.svg'
import ScanQRIcon from 'src/assets/icons/scan-qr.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { QRCodeScanner } from 'src/components/QRCodeScanner/QRCodeScanner'
import { WalletQRCode } from 'src/components/QRCodeScanner/WalletQRCode'
import { Text } from 'src/components/Text'
import { getSupportedURI, URIType } from 'src/components/WalletConnect/ScanSheet/util'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useDisplayName } from 'src/features/wallet/hooks'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'

type Props = {
  onClose: () => void
  onSelectRecipient: (address: string) => void
}

export function RecipientScanModal({ onSelectRecipient, onClose }: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const displayName = useDisplayName(activeAddress)
  const [currentScreenState, setCurrentScreenState] = useState<ScannerModalState>(
    ScannerModalState.ScanQr
  )
  const [hasScanError, setHasScanError] = useState(false)
  const [shouldFreezeCamera, setShouldFreezeCamera] = useState(false)

  const onScanCode = async (uri: string): Promise<void> => {
    // don't scan any QR codes if there is an error popup open or camera is frozen
    if (hasScanError || shouldFreezeCamera) return
    selectionAsync()
    const supportedURI = await getSupportedURI(uri)
    if (supportedURI?.type === URIType.Address) {
      setShouldFreezeCamera(true)
      onSelectRecipient(supportedURI.value)
      onClose()
    } else {
      Alert.alert(
        t('Invalid QR Code'),
        t("Make sure that you're scanning a valid Ethereum address QR code before trying again."),
        [
          {
            text: t('Try again'),
            onPress: (): void => {
              setHasScanError(false)
            },
          },
        ]
      )
    }
  }

  const onPressBottomToggle = (): void => {
    if (currentScreenState === ScannerModalState.ScanQr) {
      setCurrentScreenState(ScannerModalState.WalletQr)
    } else {
      setCurrentScreenState(ScannerModalState.ScanQr)
    }
  }

  return (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      backgroundColor={theme.colors.background0}
      name={ModalName.WalletConnectScan}
      onClose={onClose}>
      {currentScreenState === ScannerModalState.ScanQr && (
        <QRCodeScanner shouldFreezeCamera={shouldFreezeCamera} onScanCode={onScanCode} />
      )}
      {currentScreenState === ScannerModalState.WalletQr && activeAddress && (
        <WalletQRCode address={activeAddress} />
      )}
      <Flex mb="xl" mt="md" mx="md">
        <TouchableArea
          hapticFeedback
          borderColor="backgroundOutline"
          borderRadius="lg"
          borderWidth={1}
          name={ElementName.QRCodeModalToggle}
          p="md"
          style={{ backgroundColor: theme.colors.background2 }}
          onPress={onPressBottomToggle}>
          <Flex row alignItems="center" gap="sm">
            {currentScreenState === ScannerModalState.ScanQr ? (
              <Scan color={theme.colors.textSecondary} height={24} width={24} />
            ) : (
              <ScanQRIcon color={theme.colors.textSecondary} height={24} width={24} />
            )}
            <Flex shrink flexGrow={1} gap="none">
              <Text color="textPrimary" variant="bodyLarge">
                {currentScreenState === ScannerModalState.ScanQr
                  ? t('Show my QR code')
                  : t('Scan a QR code')}
              </Text>
              <Text
                adjustsFontSizeToFit
                color="textSecondary"
                numberOfLines={1}
                variant="bodyMicro">
                {currentScreenState === ScannerModalState.ScanQr
                  ? displayName?.name
                  : t('Scan a wallet address')}
              </Text>
            </Flex>
            <Chevron color={theme.colors.textSecondary} direction="e" height="20" width="15" />
          </Flex>
        </TouchableArea>
      </Flex>
      <Flex centered mt="md" position="absolute" width="100%">
        <Box bg="backgroundOutline" borderRadius="sm" height={4} width={40} />
      </Flex>
    </BottomSheetModal>
  )
}
