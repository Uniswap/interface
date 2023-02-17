import { selectionAsync } from 'expo-haptics'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, useColorScheme } from 'react-native'
import 'react-native-reanimated'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { useEagerExternalProfileRootNavigation } from 'src/app/navigation/hooks'
import Scan from 'src/assets/icons/receive.svg'
import ScanQRIcon from 'src/assets/icons/scan.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { QRCodeScanner } from 'src/components/QRCodeScanner/QRCodeScanner'
import { WalletQRCode } from 'src/components/QRCodeScanner/WalletQRCode'
import { Text } from 'src/components/Text'
import { ConnectedDappsList } from 'src/components/WalletConnect/ConnectedDapps/ConnectedDappsList'
import { PendingConnection } from 'src/components/WalletConnect/ScanSheet/PendingConnection'
import { getSupportedURI, URIType } from 'src/components/WalletConnect/ScanSheet/util'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useWCTimeoutError } from 'src/features/wallet/hooks'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { connectToApp } from 'src/features/walletConnect/WalletConnect'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { ONE_SECOND_MS } from 'src/utils/time'

const WC_TIMEOUT_DURATION_MS = 10 * ONE_SECOND_MS // timeout after 10 seconds

type Props = {
  initialScreenState?: ScannerModalState
  pendingSession: WalletConnectSession | null
  onClose: () => void
}

export function WalletConnectModal({
  initialScreenState = ScannerModalState.ScanQr,
  pendingSession,
  onClose,
}: Props): JSX.Element | null {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const isDarkMode = useColorScheme() === 'dark'
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const { sessions } = useWalletConnect(activeAddress)
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
              onPress: (): void => {
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
        connectToApp(supportedURI.value)
      }

      if (supportedURI.type === URIType.EasterEgg) {
        setShouldFreezeCamera(true)
        Alert.alert('Have you tried full-sending lately?', 'Highly recommend it', [
          {
            text: 'Bye',
            onPress: (): void => {
              onClose()
            },
          },
        ])
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

  const onPressBottomToggle = (): void => {
    if (currentScreenState === ScannerModalState.ScanQr) {
      setCurrentScreenState(ScannerModalState.WalletQr)
    } else {
      setCurrentScreenState(ScannerModalState.ScanQr)
    }
  }

  const onPressShowConnectedDapps = (): void => {
    setCurrentScreenState(ScannerModalState.ConnectedDapps)
  }

  const onPressShowScanQr = (): void => {
    setCurrentScreenState(ScannerModalState.ScanQr)
  }

  if (!activeAddress) return null

  return (
    <BottomSheetModal
      fullScreen
      backgroundColor={theme.colors.background1}
      name={ModalName.WalletConnectScan}
      onClose={onClose}>
      {pendingSession ? (
        <PendingConnection pendingSession={pendingSession} onClose={onClose} />
      ) : (
        <>
          {currentScreenState === ScannerModalState.ConnectedDapps && (
            <ConnectedDappsList
              backButton={
                <TouchableArea hapticFeedback onPress={onPressShowScanQr}>
                  <BackButtonView />
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
        </>
      )}
    </BottomSheetModal>
  )
}
