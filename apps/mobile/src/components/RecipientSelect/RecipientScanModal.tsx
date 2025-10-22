import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-reanimated'
import { QRCodeScanner } from 'src/components/QRCodeScanner/QRCodeScanner'
import { getSupportedURI, URIType } from 'src/components/Requests/ScanSheet/util'
import { Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { QrCode, Scan } from 'ui/src/components/icons'
import { useSporeColorsForTheme } from 'ui/src/hooks/useSporeColors'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import { ReceiveQRCode } from 'uniswap/src/components/ReceiveQRCode/ReceiveQRCode'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

type Props = {
  onClose: () => void
  onSelectRecipient: (address: string) => void
}

export function RecipientScanModal({ onSelectRecipient, onClose }: Props): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  const activeAddress = useActiveAccountAddress()
  const [currentScreenState, setCurrentScreenState] = useState<ScannerModalState>(ScannerModalState.ScanQr)
  const [shouldFreezeCamera, setShouldFreezeCamera] = useState(false)

  const isScanningQr = currentScreenState === ScannerModalState.ScanQr

  // We want to always show the QR Code Scanner in "dark mode"
  const colors = useSporeColorsForTheme(isScanningQr ? 'dark' : undefined)

  const onScanCode = async (uri: string): Promise<void> => {
    if (shouldFreezeCamera) {
      return
    }

    setShouldFreezeCamera(true)
    const supportedURI = await getSupportedURI(uri)

    if (supportedURI?.type === URIType.Address) {
      onSelectRecipient(supportedURI.value)
      onClose()
    } else {
      Alert.alert(t('qrScanner.recipient.error.title'), t('qrScanner.recipient.error.message'), [
        {
          text: t('common.button.tryAgain'),
          onPress: (): void => {
            setShouldFreezeCamera(false)
          },
        },
      ])
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
    <Modal
      fullScreen
      handlebarColor={colors.surface3.val}
      backgroundColor={colors.surface1.val}
      name={ModalName.WalletConnectScan}
      onClose={onClose}
    >
      {currentScreenState === ScannerModalState.ScanQr && (
        <QRCodeScanner
          theme={isScanningQr ? 'dark' : undefined}
          shouldFreezeCamera={shouldFreezeCamera}
          onScanCode={onScanCode}
        />
      )}
      {currentScreenState === ScannerModalState.WalletQr && activeAddress && <ReceiveQRCode address={activeAddress} />}
      <Flex centered mb="$spacing12" mt="$spacing16" mx="$spacing16">
        <TouchableArea
          borderColor={isDarkMode ? '$transparent' : '$surface3'}
          borderRadius="$roundedFull"
          borderWidth="$spacing1"
          p="$spacing16"
          paddingEnd="$spacing24"
          backgroundColor={colors.DEP_backgroundOverlay.val}
          testID={TestID.QRCodeModalToggle}
          onPress={onPressBottomToggle}
        >
          <Flex row alignItems="center" gap="$spacing12">
            {currentScreenState === ScannerModalState.ScanQr ? (
              <QrCode color="$neutral1" size="$icon.24" />
            ) : (
              <Scan color="$neutral1" size="$icon.24" />
            )}
            <Text color="$neutral1" variant="buttonLabel2">
              {currentScreenState === ScannerModalState.ScanQr
                ? t('qrScanner.recipient.action.show')
                : t('qrScanner.recipient.action.scan')}
            </Text>
          </Flex>
        </TouchableArea>
      </Flex>
    </Modal>
  )
}
