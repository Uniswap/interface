import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { QRCodeScanner } from 'src/components/QRCodeScanner/QRCodeScanner'
import { getSupportedURI, URIType } from 'src/components/Requests/ScanSheet/util'
import { Flex, Text, TouchableArea, useHapticFeedback, useIsDarkMode, useSporeColors } from 'ui/src'
import Scan from 'ui/src/assets/icons/receive.svg'
import ScanQRIcon from 'ui/src/assets/icons/scan.svg'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import { WalletQRCode } from 'wallet/src/components/QRCodeScanner/WalletQRCode'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

type Props = {
  onClose: () => void
  onSelectRecipient: (address: string) => void
}

export function RecipientScanModal({ onSelectRecipient, onClose }: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const activeAddress = useSelector(selectActiveAccountAddress)
  const [currentScreenState, setCurrentScreenState] = useState<ScannerModalState>(ScannerModalState.ScanQr)
  const [shouldFreezeCamera, setShouldFreezeCamera] = useState(false)
  const { hapticFeedback } = useHapticFeedback()

  const onScanCode = async (uri: string): Promise<void> => {
    // don't scan any QR codes if camera is frozen
    if (shouldFreezeCamera) {
      return
    }

    await hapticFeedback.selection()
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
  const isDarkMode = useIsDarkMode()

  return (
    <Modal fullScreen backgroundColor={colors.surface1.val} name={ModalName.WalletConnectScan} onClose={onClose}>
      {currentScreenState === ScannerModalState.ScanQr && (
        <QRCodeScanner shouldFreezeCamera={shouldFreezeCamera} onScanCode={onScanCode} />
      )}
      {currentScreenState === ScannerModalState.WalletQr && activeAddress && <WalletQRCode address={activeAddress} />}
      <Flex centered mb="$spacing12" mt="$spacing16" mx="$spacing16">
        <TouchableArea
          hapticFeedback
          borderColor={isDarkMode ? '$transparent' : '$surface3'}
          borderRadius="$roundedFull"
          borderWidth={1}
          p="$spacing16"
          paddingEnd="$spacing24"
          style={{ backgroundColor: colors.DEP_backgroundOverlay.val }}
          testID={TestID.QRCodeModalToggle}
          onPress={onPressBottomToggle}
        >
          <Flex row alignItems="center" gap="$spacing12">
            {currentScreenState === ScannerModalState.ScanQr ? (
              <Scan color={colors.neutral1.get()} height={iconSizes.icon24} width={iconSizes.icon24} />
            ) : (
              <ScanQRIcon color={colors.neutral1.get()} height={iconSizes.icon24} width={iconSizes.icon24} />
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
