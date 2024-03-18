import { selectionAsync } from 'expo-haptics'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-reanimated'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useEagerExternalProfileRootNavigation } from 'src/app/navigation/hooks'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { QRCodeScanner } from 'src/components/QRCodeScanner/QRCodeScanner'
import { WalletQRCode } from 'src/components/QRCodeScanner/WalletQRCode'
import Trace from 'src/components/Trace/Trace'
import { ConnectedDappsList } from 'src/components/WalletConnect/ConnectedDapps/ConnectedDappsList'
import {
  getSupportedURI,
  isAllowedUwULinkRequest,
  parseScantasticParams,
  URIType,
  UWULINK_PREFIX,
} from 'src/components/WalletConnect/ScanSheet/util'
import { closeAllModals, openModal } from 'src/features/modals/modalSlice'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { pairWithWalletConnectURI } from 'src/features/walletConnect/utils'
import { addRequest } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, TouchableArea, useIsDarkMode, useSporeColors } from 'ui/src'
import Scan from 'ui/src/assets/icons/receive.svg'
import ScanQRIcon from 'ui/src/assets/icons/scan.svg'
import { iconSizes } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'
import { EthMethod, UwULinkRequest } from 'wallet/src/features/walletConnect/types'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'

type Props = {
  initialScreenState?: ScannerModalState
  onClose: () => void
}

export function WalletConnectModal({
  initialScreenState = ScannerModalState.ScanQr,
  onClose,
}: Props): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const { sessions, hasPendingSessionError } = useWalletConnect(activeAddress)
  const [currentScreenState, setCurrentScreenState] =
    useState<ScannerModalState>(initialScreenState)
  const [shouldFreezeCamera, setShouldFreezeCamera] = useState(false)
  const { preload, navigate } = useEagerExternalProfileRootNavigation()
  const dispatch = useAppDispatch()
  const isUwULinkEnabled = useFeatureFlag(FEATURE_FLAGS.UwULink)
  const isScantasticEnabled = useFeatureFlag(FEATURE_FLAGS.Scantastic)

  // Update QR scanner states when pending session error alert is shown from WCv2 saga event channel
  useEffect(() => {
    if (hasPendingSessionError) {
      // Cancels the pending connection state in QRCodeScanner
      setShouldFreezeCamera(false)
    }
  }, [hasPendingSessionError, setShouldFreezeCamera])

  const onScanCode = useCallback(
    async (uri: string) => {
      // don't scan any QR codes if there is an error popup open or camera is frozen
      if (!activeAddress || hasPendingSessionError || shouldFreezeCamera) {
        return
      }
      await selectionAsync()

      const supportedURI = await getSupportedURI(uri, { isUwULinkEnabled, isScantasticEnabled })
      if (!supportedURI) {
        setShouldFreezeCamera(true)
        Alert.alert(
          t('walletConnect.error.unsupported.title'),
          // TODO(EXT-495): Add Scantastic product name here when ready
          t('walletConnect.error.unsupported.message'),
          [
            {
              text: t('common.button.tryAgain'),
              onPress: (): void => {
                setShouldFreezeCamera(false)
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
        setShouldFreezeCamera(true)
        Alert.alert(
          t('walletConnect.error.unsupportedV1.title'),
          t('walletConnect.error.unsupportedV1.message'),
          [
            {
              text: t('common.button.ok'),
              onPress: (): void => {
                setShouldFreezeCamera(false)
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
        } catch (error) {
          logger.error(error, { tags: { file: 'WalletConnectModal', function: 'onScanCode' } })
          Alert.alert(
            t('walletConnect.error.general.title'),
            t('walletConnect.error.general.message'),
            [
              {
                text: t('common.button.ok'),
                onPress: (): void => {
                  setShouldFreezeCamera(false)
                },
              },
            ]
          )
        }
      }

      if (supportedURI.type === URIType.Scantastic) {
        const params = parseScantasticParams(supportedURI.value)

        if (!params) {
          setShouldFreezeCamera(true)
          Alert.alert(
            t('walletConnect.error.scantastic.title'),
            t('walletConnect.error.scantastic.message'),
            [
              {
                text: t('common.button.ok'),
                onPress: (): void => {
                  setShouldFreezeCamera(false)
                },
              },
            ]
          )
          return
        }

        setShouldFreezeCamera(true)
        dispatch(closeAllModals())
        dispatch(
          openModal({
            name: ModalName.Scantastic,
            initialState: {
              params,
            },
          })
        )

        return
      }

      if (supportedURI.type === URIType.UwULink) {
        setShouldFreezeCamera(true)
        try {
          const parsedUwulinkRequest: UwULinkRequest = JSON.parse(supportedURI.value)
          const isAllowed = isAllowedUwULinkRequest(parsedUwulinkRequest)

          if (!isAllowed) {
            Alert.alert(
              t('walletConnect.error.uwu.title'),
              t('walletConnect.error.uwu.unsupported'),
              [
                {
                  text: t('common.button.ok'),
                  onPress: (): void => {
                    setShouldFreezeCamera(false)
                  },
                },
              ]
            )
            return
          }

          dispatch(
            addRequest({
              account: activeAddress,
              request: {
                type: EthMethod.EthSendTransaction,
                transaction: { from: activeAddress, ...parsedUwulinkRequest.value },
                sessionId: UWULINK_PREFIX, // session/internalId is WalletConnect specific, but not needed here
                internalId: UWULINK_PREFIX,
                account: activeAddress,
                dapp: {
                  ...parsedUwulinkRequest.dapp,
                  source: UWULINK_PREFIX,
                  chain_id: parsedUwulinkRequest.chainId,
                  webhook: parsedUwulinkRequest.webhook,
                },
                chainId: parsedUwulinkRequest.chainId,
              },
            })
          )
          onClose()
        } catch (_) {
          setShouldFreezeCamera(false)
          Alert.alert(t('walletConnect.error.uwu.title'), t('walletConnect.error.uwu.scan'))
        }
      }

      if (supportedURI.type === URIType.EasterEgg) {
        setShouldFreezeCamera(true)
        Alert.alert('Have you tried full-sending lately?', 'Highly recommend it', [
          {
            text: 'Bye',
            onPress: (): void => {
              setShouldFreezeCamera(true)
              onClose()
            },
          },
        ])
      }
    },
    [
      activeAddress,
      navigate,
      onClose,
      preload,
      setShouldFreezeCamera,
      shouldFreezeCamera,
      hasPendingSessionError,
      isUwULinkEnabled,
      isScantasticEnabled,
      t,
      dispatch,
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

  if (!activeAddress) {
    return null
  }

  return (
    <BottomSheetModal
      fullScreen
      backgroundColor={colors.surface1.get()}
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
        <Flex centered mb="$spacing12" mt="$spacing16" mx="$spacing16">
          <TouchableArea
            hapticFeedback
            borderColor={isDarkMode ? '$transparent' : '$surface3'}
            borderRadius="$roundedFull"
            borderWidth={1}
            p="$spacing16"
            paddingEnd="$spacing24"
            style={{ backgroundColor: colors.DEP_backgroundOverlay.val }}
            testID={ElementName.QRCodeModalToggle}
            onPress={onPressBottomToggle}>
            <Flex row alignItems="center" gap="$spacing12">
              {currentScreenState === ScannerModalState.ScanQr ? (
                <Scan
                  color={colors.neutral1.get()}
                  height={iconSizes.icon24}
                  width={iconSizes.icon24}
                />
              ) : (
                <ScanQRIcon
                  color={colors.neutral1.get()}
                  height={iconSizes.icon24}
                  width={iconSizes.icon24}
                />
              )}
              <Text color="$neutral1" variant="buttonLabel2">
                {currentScreenState === ScannerModalState.ScanQr
                  ? t('qrScanner.recipient.action.show')
                  : t('qrScanner.recipient.action.scan')}
              </Text>
            </Flex>
          </TouchableArea>
        </Flex>
      </>
    </BottomSheetModal>
  )
}
