import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { useEagerExternalProfileRootNavigation } from 'src/app/navigation/hooks'
import { QRCodeScanner } from 'src/components/QRCodeScanner/QRCodeScanner'
import { ConnectedDappsList } from 'src/components/Requests/ConnectedDapps/ConnectedDappsList'
import { URIType, getSupportedURI } from 'src/components/Requests/ScanSheet/util'
import {
  getFormattedUwuLinkTxnRequest,
  isAllowedUwuLinkRequest,
  useUwuLinkContractAllowlist,
} from 'src/components/Requests/Uwulink/utils'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { openDeepLink } from 'src/features/deepLinking/handleDeepLinkSaga'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { pairWithWalletConnectURI } from 'src/features/walletConnect/utils'
import { addRequest } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import Scan from 'ui/src/assets/icons/receive.svg'
import ScanQRIcon from 'ui/src/assets/icons/scan.svg'
import { useSporeColorsForTheme } from 'ui/src/hooks/useSporeColors'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { UwULinkRequest } from 'uniswap/src/types/walletConnect'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { WalletQRCode } from 'wallet/src/components/QRCodeScanner/WalletQRCode'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import { useContractManager, useProviderManager } from 'wallet/src/features/wallet/context'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

type Props = {
  initialScreenState?: ScannerModalState
  onClose: () => void
}

export function WalletConnectModal({
  initialScreenState = ScannerModalState.ScanQr,
  onClose,
}: Props): JSX.Element | null {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  const activeAccount = useActiveAccount()
  const { sessions, hasPendingSessionError } = useWalletConnect(activeAccount?.address)
  const [currentScreenState, setCurrentScreenState] = useState<ScannerModalState>(initialScreenState)
  const [shouldFreezeCamera, setShouldFreezeCamera] = useState(false)
  const { preload, navigate } = useEagerExternalProfileRootNavigation()
  const dispatch = useDispatch()
  const isUwULinkEnabled = useFeatureFlag(FeatureFlags.UwULink)
  const isScantasticEnabled = useFeatureFlag(FeatureFlags.Scantastic)

  const uwuLinkContractAllowlist = useUwuLinkContractAllowlist()

  const providerManager = useProviderManager()
  const contractManager = useContractManager()

  const isScanningQr = currentScreenState === ScannerModalState.ScanQr

  // We want to always show the QR Code Scanner in "dark mode"
  const colors = useSporeColorsForTheme(isScanningQr ? 'dark' : undefined)

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
      if (!activeAccount || hasPendingSessionError || shouldFreezeCamera) {
        return
      }

      const supportedURI = await getSupportedURI(uri, {
        isUwULinkEnabled,
        isScantasticEnabled,
      })
      if (!supportedURI) {
        setShouldFreezeCamera(true)
        Alert.alert(t('walletConnect.error.unsupported.title'), t('walletConnect.error.unsupported.message'), [
          {
            text: t('common.button.tryAgain'),
            onPress: (): void => {
              setShouldFreezeCamera(false)
            },
          },
        ])

        return
      }

      if (supportedURI.type === URIType.Address) {
        setShouldFreezeCamera(true)
        await preload(supportedURI.value)
        await navigate(supportedURI.value, onClose)
        return
      }

      if (supportedURI.type === URIType.WalletConnectURL) {
        setShouldFreezeCamera(true)
        Alert.alert(t('walletConnect.error.unsupportedV1.title'), t('walletConnect.error.unsupportedV1.message'), [
          {
            text: t('common.button.ok'),
            onPress: (): void => {
              setShouldFreezeCamera(false)
            },
          },
        ])
        return
      }

      if (supportedURI.type === URIType.WalletConnectV2URL) {
        setShouldFreezeCamera(true)
        try {
          await pairWithWalletConnectURI(supportedURI.value)
        } catch (error) {
          logger.error(error, {
            tags: { file: 'WalletConnectModal', function: 'onScanCode' },
          })

          const title = t('walletConnect.error.general.title')
          const message =
            isDevEnv() || isBetaEnv()
              ? error?.toString?.() || t('walletConnect.error.general.message')
              : t('walletConnect.error.general.message')

          Alert.alert(title, message, [
            {
              text: t('common.button.ok'),
              onPress: (): void => {
                setShouldFreezeCamera(false)
              },
            },
          ])
        }
      }

      if (supportedURI.type === URIType.Scantastic) {
        setShouldFreezeCamera(true)
        dispatch(openDeepLink({ url: uri, coldStart: false }))
        onClose()
        return
      }

      if (supportedURI.type === URIType.UwULink) {
        setShouldFreezeCamera(true)
        try {
          const parsedUwulinkRequest: UwULinkRequest = JSON.parse(supportedURI.value)
          const isAllowed = isAllowedUwuLinkRequest(parsedUwulinkRequest, uwuLinkContractAllowlist)
          if (!isAllowed) {
            Alert.alert(t('walletConnect.error.uwu.title'), t('walletConnect.error.uwu.unsupported'), [
              {
                text: t('common.button.ok'),
                onPress: (): void => {
                  setShouldFreezeCamera(false)
                },
              },
            ])
            return
          }

          const wcRequest = await getFormattedUwuLinkTxnRequest({
            request: parsedUwulinkRequest,
            activeAccount,
            allowList: uwuLinkContractAllowlist,
            providerManager,
            contractManager,
          })

          dispatch(addRequest(wcRequest))

          onClose()
        } catch (_) {
          Alert.alert(t('walletConnect.error.uwu.title'), t('walletConnect.error.uwu.scan'), [
            {
              text: t('common.button.ok'),
              onPress: (): void => {
                setShouldFreezeCamera(false)
              },
            },
          ])
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
      activeAccount,
      hasPendingSessionError,
      shouldFreezeCamera,
      isUwULinkEnabled,
      isScantasticEnabled,
      t,
      preload,
      navigate,
      onClose,
      dispatch,
      uwuLinkContractAllowlist,
      providerManager,
      contractManager,
    ],
  )

  const onPressBottomToggle = (): void => {
    if (isScanningQr) {
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

  if (!activeAccount) {
    return null
  }

  return (
    <Modal
      fullScreen
      handlebarColor={colors.surface3.val}
      backgroundColor={colors.surface1.val}
      name={ModalName.WalletConnectScan}
      onClose={onClose}
    >
      <>
        {currentScreenState === ScannerModalState.ConnectedDapps && (
          <ConnectedDappsList
            backButton={
              <TouchableArea onPress={onPressShowScanQr}>
                <BackButtonView />
              </TouchableArea>
            }
            sessions={sessions}
          />
        )}
        {isScanningQr && (
          <Trace logImpression element={ElementName.WalletConnectScan}>
            <QRCodeScanner
              theme="dark"
              numConnections={sessions.length}
              shouldFreezeCamera={shouldFreezeCamera}
              onPressConnections={onPressShowConnectedDapps}
              onScanCode={onScanCode}
            />
          </Trace>
        )}
        {currentScreenState === ScannerModalState.WalletQr && (
          <Trace logImpression element={ElementName.WalletQRCode}>
            <WalletQRCode address={activeAccount.address} />
          </Trace>
        )}
        <Flex centered mb="$spacing12" mt="$spacing16" mx="$spacing16">
          <TouchableArea
            borderColor={isDarkMode ? '$transparent' : '$surface3'}
            borderRadius="$roundedFull"
            borderWidth={1}
            p="$spacing16"
            paddingEnd="$spacing24"
            backgroundColor={colors.DEP_backgroundOverlay.val}
            testID={TestID.QRCodeModalToggle}
            onPress={onPressBottomToggle}
          >
            <Flex row alignItems="center" gap="$spacing12">
              {isScanningQr ? (
                <Scan color={colors.neutral1.val} height={iconSizes.icon24} width={iconSizes.icon24} />
              ) : (
                <ScanQRIcon color={colors.neutral1.val} height={iconSizes.icon24} width={iconSizes.icon24} />
              )}
              <Text color={colors.neutral1.val} variant="buttonLabel2">
                {isScanningQr ? t('qrScanner.recipient.action.show') : t('qrScanner.recipient.action.scan')}
              </Text>
            </Flex>
          </TouchableArea>
        </Flex>
      </>
    </Modal>
  )
}
