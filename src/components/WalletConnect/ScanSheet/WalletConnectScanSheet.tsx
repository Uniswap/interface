import { notificationAsync, selectionAsync } from 'expo-haptics'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'react-native-qrcode-svg'
import 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ChangeNetworkModal } from 'src/components/Network/ChangeNetworkModal'
import { Text } from 'src/components/Text'
import { ConnectedDappsList } from 'src/components/WalletConnect/ConnectedDapps/ConnectedDappsList'
import { QRCodeScanner } from 'src/components/WalletConnect/ScanSheet/QRCodeScanner'
import { WalletQRCode } from 'src/components/WalletConnect/ScanSheet/WalletQRCode'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { changeChainId, connectToApp } from 'src/features/walletConnect/WalletConnect'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { shortenAddress } from 'src/utils/addresses'
import { opacify } from 'src/utils/colors'

enum ScanSheetScreenState {
  ScanQr,
  ConnectedDapps,
  WalletQr,
}

type Props = {
  isVisible: boolean
  initialScreenState?: ScanSheetScreenState
  onClose: () => void
}

export function WalletConnectScanSheet({
  initialScreenState = ScanSheetScreenState.ScanQr,
  isVisible,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const activeAccount = useActiveAccount()
  const { sessions } = useWalletConnect(activeAccount?.address)

  const address = activeAccount?.address

  const [currentScreenState, setCurrentScreenState] =
    useState<ScanSheetScreenState>(initialScreenState)

  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WalletConnectSession>()

  const onCloseNetworkModal = () => setShowNetworkModal(false)

  const theme = useAppTheme()

  const onScanCode = (uri: string) => {
    notificationAsync()

    if (!activeAccount) return
    connectToApp(uri, activeAccount.address)
    onClose()
  }

  const onPressBottomToggle = () => {
    selectionAsync()
    if (currentScreenState === ScanSheetScreenState.ScanQr) {
      setCurrentScreenState(ScanSheetScreenState.WalletQr)
    } else {
      setCurrentScreenState(ScanSheetScreenState.ScanQr)
    }
  }

  const onPressShowConnectedDapps = () => {
    selectionAsync()
    setCurrentScreenState(ScanSheetScreenState.ConnectedDapps)
  }

  const onPressShowScanQr = () => {
    selectionAsync()
    setCurrentScreenState(ScanSheetScreenState.ScanQr)
  }

  if (!activeAccount || !address) return null

  return (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      backgroundColor={theme.colors.mainBackground}
      isVisible={isVisible}
      name={ModalName.WalletConnectScan}
      onClose={onClose}>
      {currentScreenState === ScanSheetScreenState.ConnectedDapps && (
        <ConnectedDappsList
          goBack={onPressShowScanQr}
          sessions={sessions}
          setSelectedSession={setSelectedSession}
          setShowNetworkModal={setShowNetworkModal}
        />
      )}
      {currentScreenState === ScanSheetScreenState.ScanQr && (
        <QRCodeScanner
          numConnections={sessions.length}
          onPressConnections={onPressShowConnectedDapps}
          onScanCode={onScanCode}
        />
      )}
      {currentScreenState === ScanSheetScreenState.WalletQr && (
        <WalletQRCode address={activeAccount.address} />
      )}
      <Flex mb="xl" mt="md" mx="md">
        <Button
          borderRadius="lg"
          name={ElementName.QRCodeModalToggle}
          p="md"
          style={{ backgroundColor: opacify(30, theme.colors.neutralContainer) }}
          onPress={onPressBottomToggle}>
          <Flex row gap="sm">
            <Flex centered backgroundColor="white" borderRadius="sm" padding="xs">
              <QRCode size={30} value={activeAccount.address} />
            </Flex>
            <Flex flexGrow={1} gap="xxs">
              <Text color="neutralTextPrimary" variant="subHead1">
                {currentScreenState === ScanSheetScreenState.ScanQr
                  ? t('Show my QR code')
                  : t('Scan a QR code')}
              </Text>
              <Text color="neutralTextSecondary" variant="body2">
                {currentScreenState === ScanSheetScreenState.ScanQr
                  ? shortenAddress(activeAccount.address)
                  : t('Connect to an app with WalletConnect')}
              </Text>
            </Flex>
            <Chevron
              color={theme.colors.neutralTextSecondary}
              direction="e"
              height="20"
              width="15"
            />
          </Flex>
        </Button>
      </Flex>
      <BottomSheetModal
        isVisible={showNetworkModal}
        name={ModalName.NetworkSelector}
        onClose={onCloseNetworkModal}>
        {selectedSession && (
          <ChangeNetworkModal
            chainId={parseInt(selectedSession.dapp.chain_id, 10)}
            setChainId={(chainId) => {
              if (activeAccount) changeChainId(selectedSession.id, chainId, activeAccount.address)
            }}
            onPressClose={onCloseNetworkModal}
          />
        )}
      </BottomSheetModal>
      <Flex centered mt="md" position="absolute" width="100%">
        <Box bg="deprecated_gray400" borderRadius="sm" height={4} width={40} />
      </Flex>
    </BottomSheetModal>
  )
}
