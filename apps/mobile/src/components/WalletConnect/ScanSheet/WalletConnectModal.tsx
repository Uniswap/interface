import { selectionAsync } from 'expo-haptics'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-reanimated'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { useEagerExternalProfileRootNavigation } from 'src/app/navigation/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { QRCodeScanner } from 'src/components/QRCodeScanner/QRCodeScanner'
import { WalletQRCode } from 'src/components/QRCodeScanner/WalletQRCode'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import { ConnectedDappsList } from 'src/components/WalletConnect/ConnectedDapps/ConnectedDappsList'
import { getSupportedURI, URIType } from 'src/components/WalletConnect/ScanSheet/util'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useWCTimeoutError } from 'src/features/wallet/hooks'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { pairWithWalletConnectURI } from 'src/features/walletConnect/utils'
import Scan from 'ui/src/assets/icons/receive.svg'
import ScanQRIcon from 'ui/src/assets/icons/scan.svg'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

const WC_TIMEOUT_DURATION_MS = 10 * ONE_SECOND_MS // timeout after 10 seconds

type Props = {
  initialScreenState?: ScannerModalState
  onClose: () => void
}

export function WalletConnectModal({
  initialScreenState = ScannerModalState.ScanQr,
  onClose,
}: Props): JSX.Element | null {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const isDarkMode = useIsDarkMode()
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const { sessions, hasPendingSessionError } = useWalletConnect(activeAddress)
  const [currentScreenState, setCurrentScreenState] =
    useState<ScannerModalState>(initialScreenState)
  const { hasScanError, setHasScanError, shouldFreezeCamera, setShouldFreezeCamera } =
    useWCTimeoutError(WC_TIMEOUT_DURATION_MS)
  const { preload, navigate } = useEagerExternalProfileRootNavigation()

  // Update QR scanner states when pending session error alert is shown from WCv2 saga event channel
  useEffect(() => {
    setHasScanError(hasPendingSessionError)
    if (hasPendingSessionError) {
      // Cancels the pending connection state in QRCodeScanner
      setShouldFreezeCamera(false)
    }
  }, [hasPendingSessionError, setShouldFreezeCamera, setHasScanError])

  const onScanCode = useCallback(
    async (uri: string) => {
      // don't scan any QR codes if there is an error popup open or camera is frozen
      if (!activeAddress || hasScanError || shouldFreezeCamera) return
      await selectionAsync()

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
        await preload(supportedURI.value)
        await navigate(supportedURI.value, onClose)
        return
      }

      if (supportedURI.type === URIType.WalletConnectURL) {
        setHasScanError(true)
        Alert.alert(
          t('Invalid QR Code'),
          t(
            "WalletConnect v1 is no longer supported. The application you're trying to connect to needs to upgrade to WalletConnect v2."
          ),
          [
            {
              text: t('OK'),
              onPress: (): void => {
                setHasScanError(false)
              },
            },
          ]
        )
        return
      }

      if (supportedURI.type === URIType.WalletConnectV2URL) {
        setShouldFreezeCamera(true)
        try {
          await pairWithWalletConnectURI(supportedURI.value)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (errorMessage: any) {
          setHasScanError(true)
          setShouldFreezeCamera(false)
          Alert.alert(
            t('WalletConnect Error'),
            t(`There was an issue with WalletConnect. \n\n Error information:\n {{error}}`, {
              error: errorMessage,
            }),
            [
              {
                text: t('OK'),
                onPress: (): void => {
                  setHasScanError(false)
                },
              },
            ]
          )
        }
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
      backgroundColor={theme.colors.surface1}
      name={ModalName.WalletConnectScan}
      onClose={onClose}>
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
          <Trace logImpression element={ElementName.WalletConnectScan}>
            <QRCodeScanner
              numConnections={sessions.length}
              shouldFreezeCamera={shouldFreezeCamera}
              onPressConnections={onPressShowConnectedDapps}
              onScanCode={onScanCode}
            />
          </Trace>
        )}
        {currentScreenState === ScannerModalState.WalletQr && (
          <Trace logImpression element={ElementName.WalletQRCode}>
            <WalletQRCode address={activeAddress} />
          </Trace>
        )}
        <Flex centered mb="spacing48" mt="spacing16" mx="spacing16">
          <TouchableArea
            hapticFeedback
            borderColor={isDarkMode ? 'none' : 'surface3'}
            borderRadius="roundedFull"
            borderWidth={1}
            p="spacing16"
            paddingEnd="spacing24"
            style={{ backgroundColor: theme.colors.DEP_backgroundOverlay }}
            testID={ElementName.QRCodeModalToggle}
            onPress={onPressBottomToggle}>
            <Flex row alignItems="center" gap="spacing12">
              {currentScreenState === ScannerModalState.ScanQr ? (
                <Scan color={theme.colors.neutral1} height={24} width={24} />
              ) : (
                <ScanQRIcon color={theme.colors.neutral1} height={24} width={24} />
              )}
              <Text color="neutral1" variant="buttonLabelMedium">
                {currentScreenState === ScannerModalState.ScanQr
                  ? t('Show my QR code')
                  : t('Scan a QR code')}
              </Text>
            </Flex>
          </TouchableArea>
        </Flex>
      </>
    </BottomSheetModal>
  )
}
