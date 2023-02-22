import { selectionAsync } from 'expo-haptics'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, useColorScheme } from 'react-native'
import 'react-native-reanimated'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import Scan from 'src/assets/icons/receive.svg'
import ScanQRIcon from 'src/assets/icons/scan.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { QRCodeScanner } from 'src/components/QRCodeScanner/QRCodeScanner'
import { WalletQRCode } from 'src/components/QRCodeScanner/WalletQRCode'
import { Text } from 'src/components/Text'
import { getSupportedURI, URIType } from 'src/components/WalletConnect/ScanSheet/util'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'

type Props = {
  onClose: () => void
  onSelectRecipient: (address: string) => void
}

export function RecipientScanModal({ onSelectRecipient, onClose }: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const activeAddress = useAppSelector(selectActiveAccountAddress)
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
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <BottomSheetModal
      fullScreen
      backgroundColor={theme.colors.background1}
      name={ModalName.WalletConnectScan}
      onClose={onClose}>
      {currentScreenState === ScannerModalState.ScanQr && (
        <QRCodeScanner shouldFreezeCamera={shouldFreezeCamera} onScanCode={onScanCode} />
      )}
      {currentScreenState === ScannerModalState.WalletQr && activeAddress && (
        <WalletQRCode address={activeAddress} />
      )}
      <Flex centered mb="spacing36" mt="spacing16" mx="spacing16">
        <TouchableArea
          hapticFeedback
          borderColor={isDarkMode ? 'none' : 'backgroundOutline'}
          borderRadius="roundedFull"
          borderWidth={1}
          name={ElementName.QRCodeModalToggle}
          p="spacing16"
          paddingEnd="spacing24"
          style={{ backgroundColor: theme.colors.backgroundOverlay }}
          onPress={onPressBottomToggle}>
          <Flex row alignItems="center" gap="spacing12">
            {currentScreenState === ScannerModalState.ScanQr ? (
              <Scan color={theme.colors.textPrimary} height={24} width={24} />
            ) : (
              <ScanQRIcon color={theme.colors.textPrimary} height={24} width={24} />
            )}
            <Text color="textPrimary" variant="buttonLabelMedium">
              {currentScreenState === ScannerModalState.ScanQr
                ? t('Show my QR code')
                : t('Scan a QR code')}
            </Text>
          </Flex>
        </TouchableArea>
      </Flex>
    </BottomSheetModal>
  )
}
