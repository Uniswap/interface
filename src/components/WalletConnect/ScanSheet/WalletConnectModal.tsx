import { selectionAsync } from 'expo-haptics'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import 'react-native-reanimated'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import ScanQRIcon from 'src/assets/icons/scan-qr.svg'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ConnectedDappsList } from 'src/components/WalletConnect/ConnectedDapps/ConnectedDappsList'
import { PendingConnection } from 'src/components/WalletConnect/ScanSheet/PendingConnection'
import { QRCodeScanner } from 'src/components/WalletConnect/ScanSheet/QRCodeScanner'
import { WalletQRCode } from 'src/components/WalletConnect/ScanSheet/WalletQRCode'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useDisplayName, useWCTimeoutError } from 'src/features/wallet/hooks'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { connectToApp, isValidWCUrl } from 'src/features/walletConnect/WalletConnect'

const WC_TIMEOUT_DURATION_MS = 10000 // timeout after 10 seconds

export enum WalletConnectModalState {
  ScanQr,
  ConnectedDapps,
  WalletQr,
}

type Props = {
  isVisible: boolean
  initialScreenState?: WalletConnectModalState
  onClose: () => void
}

export function WalletConnectModal({
  initialScreenState = WalletConnectModalState.ScanQr,
  isVisible,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const displayName = useDisplayName(activeAddress)
  const { sessions, pendingSession } = useWalletConnect(activeAddress)
  const [currentScreenState, setCurrentScreenState] =
    useState<WalletConnectModalState>(initialScreenState)
  const { hasScanError, setHasScanError, shouldFreezeCamera, setShouldFreezeCamera } =
    useWCTimeoutError(pendingSession, WC_TIMEOUT_DURATION_MS)

  const onScanCode = async (uri: string) => {
    // don't scan any QR codes if there is an error popup open or camera is frozen
    if (!activeAddress || hasScanError || shouldFreezeCamera) return
    selectionAsync()

    if (await isValidWCUrl(uri.toString())) {
      setShouldFreezeCamera(true)
      connectToApp(uri)
    } else {
      setHasScanError(true)
      Alert.alert(
        t('Invalid QR Code'),
        t('Please scan a WalletConnect or Ethereum address QR code.'),
        [
          {
            text: t('Try again'),
            onPress: () => {
              setHasScanError(false)
            },
          },
        ]
      )
    }
  }

  const onPressBottomToggle = () => {
    selectionAsync()
    if (currentScreenState === WalletConnectModalState.ScanQr) {
      setCurrentScreenState(WalletConnectModalState.WalletQr)
    } else {
      setCurrentScreenState(WalletConnectModalState.ScanQr)
    }
  }

  const onPressShowConnectedDapps = () => {
    selectionAsync()
    setCurrentScreenState(WalletConnectModalState.ConnectedDapps)
  }

  const onPressShowScanQr = () => {
    selectionAsync()
    setCurrentScreenState(WalletConnectModalState.ScanQr)
  }

  if (!activeAddress) return null

  return (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      backgroundColor={theme.colors.mainBackground}
      isVisible={isVisible}
      name={ModalName.WalletConnectScan}
      onClose={onClose}>
      {pendingSession ? (
        <PendingConnection pendingSession={pendingSession} onClose={onClose} />
      ) : (
        <>
          {currentScreenState === WalletConnectModalState.ConnectedDapps && (
            <ConnectedDappsList goBack={onPressShowScanQr} sessions={sessions} />
          )}
          {currentScreenState === WalletConnectModalState.ScanQr && (
            <QRCodeScanner
              numConnections={sessions.length}
              shouldFreezeCamera={shouldFreezeCamera}
              onPressConnections={onPressShowConnectedDapps}
              onScanCode={onScanCode}
            />
          )}
          {currentScreenState === WalletConnectModalState.WalletQr && (
            <WalletQRCode address={activeAddress} />
          )}
          <Flex mb="xl" mt="md" mx="md">
            <Button
              borderRadius="lg"
              name={ElementName.QRCodeModalToggle}
              p="md"
              style={{ backgroundColor: theme.colors.backgroundContainer }}
              onPress={onPressBottomToggle}>
              <Flex row gap="sm">
                {currentScreenState === WalletConnectModalState.ScanQr ? (
                  <Flex centered backgroundColor="white" borderRadius="sm" padding="xs">
                    <QRCode size={30} value={activeAddress} />
                  </Flex>
                ) : (
                  <Flex centered>
                    <ScanQRIcon color={theme.colors.textTertiary} height={35} width={35} />
                  </Flex>
                )}
                <Flex shrink flexGrow={1} gap="xxs">
                  <Text color="textPrimary" variant="subhead">
                    {currentScreenState === WalletConnectModalState.ScanQr
                      ? t('Show my QR code')
                      : t('Scan a QR code')}
                  </Text>
                  <Text
                    adjustsFontSizeToFit
                    color="textSecondary"
                    numberOfLines={1}
                    variant="bodySmall">
                    {currentScreenState === WalletConnectModalState.ScanQr
                      ? displayName?.name
                      : t('Connect to an app with WalletConnect')}
                  </Text>
                </Flex>
                <Chevron color={theme.colors.textTertiary} direction="e" height="20" width="15" />
              </Flex>
            </Button>
          </Flex>
        </>
      )}
      <Flex centered mt="md" position="absolute" width="100%">
        <Box bg="backgroundOutline" borderRadius="sm" height={4} width={40} />
      </Flex>
    </BottomSheetModal>
  )
}
