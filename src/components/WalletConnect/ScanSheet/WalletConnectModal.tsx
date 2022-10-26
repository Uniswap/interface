import { selectionAsync } from 'expo-haptics'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-reanimated'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { useEagerExternalProfileRootNavigation } from 'src/app/navigation/hooks'
import Scan from 'src/assets/icons/qr-simple.svg'
import ScanQRIcon from 'src/assets/icons/scan-qr.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { QRCodeScanner } from 'src/components/QRCodeScanner/QRCodeScanner'
import { WalletQRCode } from 'src/components/QRCodeScanner/WalletQRCode'
import { Text } from 'src/components/Text'
import { ConnectedDappsList } from 'src/components/WalletConnect/ConnectedDapps/ConnectedDappsList'
import { PendingConnection } from 'src/components/WalletConnect/ScanSheet/PendingConnection'
import { getSupportedURI, URIType } from 'src/components/WalletConnect/ScanSheet/util'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useDisplayName, useWCTimeoutError } from 'src/features/wallet/hooks'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { connectToApp } from 'src/features/walletConnect/WalletConnect'

const WC_TIMEOUT_DURATION_MS = 10000 // timeout after 10 seconds

type Props = {
  isVisible: boolean
  initialScreenState?: ScannerModalState
  onClose: () => void
}

export function WalletConnectModal({
  initialScreenState = ScannerModalState.ScanQr,
  isVisible,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const displayName = useDisplayName(activeAddress)
  const { sessions, pendingSession } = useWalletConnect(activeAddress)
  const [currentScreenState, setCurrentScreenState] =
    useState<ScannerModalState>(initialScreenState)
  const { hasScanError, setHasScanError, shouldFreezeCamera, setShouldFreezeCamera } =
    useWCTimeoutError(pendingSession, WC_TIMEOUT_DURATION_MS)
  const { preload, navigate } = useEagerExternalProfileRootNavigation()

  const onScanCode = useCallback(
    async (uri: string) => {
      // don't scan any QR codes if there is an error popup open or camera is frozen
      if (!activeAddress || hasScanError || shouldFreezeCamera) return
      selectionAsync()

      const supportedURI = await getSupportedURI(uri)
      if (!supportedURI) {
        setHasScanError(true)
        Alert.alert(
          t('Invalid QR Code'),
          t(
            "Make sure that you're scanning a valid WalletConnect or Ethereum address QR code before trying again."
          ),
          [
            {
              text: t('Try again'),
              onPress: () => {
                setHasScanError(false)
              },
            },
          ]
        )

        return
      }

      if (supportedURI.type === URIType.Address) {
        preload(supportedURI.value)
        navigate(supportedURI.value, onClose)
        return
      }

      if (supportedURI.type === URIType.WalletConnectURL) {
        setShouldFreezeCamera(true)
        connectToApp(uri)
      }
    },
    [
      activeAddress,
      hasScanError,
      navigate,
      onClose,
      preload,
      setHasScanError,
      setShouldFreezeCamera,
      shouldFreezeCamera,
      t,
    ]
  )

  const onPressBottomToggle = () => {
    selectionAsync()
    if (currentScreenState === ScannerModalState.ScanQr) {
      setCurrentScreenState(ScannerModalState.WalletQr)
    } else {
      setCurrentScreenState(ScannerModalState.ScanQr)
    }
  }

  const onPressShowConnectedDapps = () => {
    selectionAsync()
    setCurrentScreenState(ScannerModalState.ConnectedDapps)
  }

  const onPressShowScanQr = () => {
    selectionAsync()
    setCurrentScreenState(ScannerModalState.ScanQr)
  }

  if (!activeAddress) return null

  return (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      backgroundColor={theme.colors.background0}
      isVisible={isVisible}
      name={ModalName.WalletConnectScan}
      onClose={onClose}>
      {pendingSession ? (
        <PendingConnection pendingSession={pendingSession} onClose={onClose} />
      ) : (
        <>
          {currentScreenState === ScannerModalState.ConnectedDapps && (
            <ConnectedDappsList
              backButton={
                <TouchableArea onPress={onPressShowScanQr}>
                  <Chevron color={theme.colors.textSecondary} height={24} width={24} />
                </TouchableArea>
              }
              sessions={sessions}
            />
          )}
          {currentScreenState === ScannerModalState.ScanQr && (
            <QRCodeScanner
              numConnections={sessions.length}
              shouldFreezeCamera={shouldFreezeCamera}
              onPressConnections={onPressShowConnectedDapps}
              onScanCode={onScanCode}
            />
          )}
          {currentScreenState === ScannerModalState.WalletQr && (
            <WalletQRCode address={activeAddress} />
          )}
          <Flex mb="xl" mt="md" mx="md">
            <TouchableArea
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
                  <Text color="textPrimary" variant="subheadLarge">
                    {currentScreenState === ScannerModalState.ScanQr
                      ? t('Show my QR code')
                      : t('Scan a QR code')}
                  </Text>
                  <Text
                    adjustsFontSizeToFit
                    color="textSecondary"
                    numberOfLines={1}
                    variant="buttonLabelMicro">
                    {currentScreenState === ScannerModalState.ScanQr
                      ? displayName?.name
                      : t('Connect to an app with WalletConnect')}
                  </Text>
                </Flex>
                <Chevron color={theme.colors.textSecondary} direction="e" height="20" width="15" />
              </Flex>
            </TouchableArea>
          </Flex>
        </>
      )}
      <Flex centered mt="md" position="absolute" width="100%">
        <Box bg="backgroundOutline" borderRadius="sm" height={4} width={40} />
      </Flex>
    </BottomSheetModal>
  )
}
