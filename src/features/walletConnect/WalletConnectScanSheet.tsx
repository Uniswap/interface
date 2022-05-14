import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import QRCode from 'react-native-qrcode-svg'
import 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import QrScanIcon from 'src/assets/icons/qr-scan-icon.svg'
import WalletConnectLogo from 'src/assets/icons/walletconnect.svg'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ChangeNetworkModal } from 'src/components/Network/ChangeNetworkModal'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { DappConnectionItem } from 'src/features/walletConnect/DappConnectionItem'
import { QRCodeScanner } from 'src/features/walletConnect/QRCodeScanner'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { changeChainId, connectToApp } from 'src/features/walletConnect/WalletConnect'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { WalletQRCode } from 'src/features/walletConnect/WalletQRCode'
import { dimensions } from 'src/styles/sizing'
import { shortenAddress } from 'src/utils/addresses'
import { opacify } from 'src/utils/colors'

type Props = {
  isVisible: boolean
  onClose: () => void
}

export function WalletConnectScanSheet({ isVisible, onClose }: Props) {
  const { t } = useTranslation()
  const activeAccount = useActiveAccount()
  const { sessions } = useWalletConnect(activeAccount?.address)

  const address = activeAccount?.address
  const ens = useENS(ChainId.Mainnet, address)

  const [showQRCode, setShowQRCode] = useState(false)
  const [showConnectedDapps, setShowConnectedDapps] = useState(false)
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WalletConnectSession>()

  const onCloseNetworkModal = () => setShowNetworkModal(false)

  const onPressQRCode = () => setShowQRCode(true)

  const theme = useAppTheme()

  const onScanCode = (uri: string) => {
    if (!activeAccount) return

    connectToApp(uri, activeAccount.address)
    onClose()
  }

  if (!activeAccount || !address) return null

  return (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      backgroundColor="black"
      isVisible={isVisible}
      name={ModalName.WalletConnectScan}
      onClose={onClose}>
      <Flex
        centered
        gap="md"
        mt="md"
        position="absolute"
        width={dimensions.fullWidth}
        zIndex="modal">
        <Box bg="deprecated_gray400" borderRadius="sm" height={4} width={40} />
      </Flex>
      <Box borderRadius="lg" flex={1} pt="xxl" style={ModalStyles.gradient}>
        <Flex centered gap="sm">
          <Text color="deprecated_textColor" variant="bodyLgBold">
            {showQRCode ? ens.name ?? shortenAddress(address) : t('Scan a QR code')}
          </Text>
          <Flex centered row gap="sm">
            {!showQRCode && <WalletConnectLogo height={16} width={16} />}
            <Text variant="bodySmSoft">
              {showQRCode
                ? ens.name
                  ? shortenAddress(address)
                  : ''
                : t('Use WalletConnect or send assets')}
            </Text>
          </Flex>
        </Flex>

        {/* This is temporary UI/UX and the mt is there because existing header is positioned absolute*/}
        {showConnectedDapps ? (
          <Flex grow mt="xxl" pt="lg">
            <FlatList
              columnWrapperStyle={{ marginHorizontal: theme.spacing.sm }}
              data={sessions}
              keyExtractor={(item) => item.id}
              numColumns={2}
              renderItem={(item) => (
                <DappConnectionItem
                  wrapped={item}
                  onPressChangeNetwork={() => {
                    setSelectedSession(item.item)
                    setShowNetworkModal(true)
                  }}
                />
              )}
            />
          </Flex>
        ) : !showQRCode ? (
          <QRCodeScanner
            numConnections={sessions.length}
            onPressConnections={() => setShowConnectedDapps(true)}
            onScanCode={onScanCode}
          />
        ) : (
          <WalletQRCode address={activeAccount.address} />
        )}
      </Box>
      <Flex gap="sm" mb="xl" mt="md" mx="md">
        {showQRCode ? (
          <Button
            borderRadius="lg"
            name={ElementName.QRCodeModalToggle}
            p="md"
            style={{ backgroundColor: opacify(50, theme.colors.deprecated_gray100) }}
            onPress={() => setShowQRCode(false)}>
            <Flex row gap="sm">
              <Flex
                centered
                backgroundColor="deprecated_background1"
                borderRadius="sm"
                padding="xs">
                <QrScanIcon />
              </Flex>
              <Flex flexGrow={1} gap="xxs">
                <Text variant="bodyBold">{t('Scan a QR code')}</Text>
                <Text variant="bodySmSoft">{t('Use WalletConnect or send assets')}</Text>
              </Flex>
              <Chevron
                color={theme.colors.deprecated_textColor}
                direction="e"
                height="20"
                width="10"
              />
            </Flex>
          </Button>
        ) : (
          <Button
            borderRadius="lg"
            name={ElementName.QRCodeModalToggle}
            p="md"
            style={{ backgroundColor: opacify(50, theme.colors.deprecated_gray100) }}
            onPress={onPressQRCode}>
            <Flex row gap="sm">
              <Flex centered backgroundColor="white" borderRadius="sm" padding="xs">
                <QRCode size={30} value={activeAccount.address} />
              </Flex>
              <Flex flexGrow={1} gap="xxs">
                <Text variant="bodyBold">{t('Show my QR code')}</Text>
                <Text variant="bodySmSoft">{shortenAddress(activeAccount.address)}</Text>
              </Flex>
              <Chevron
                color={theme.colors.deprecated_textColor}
                direction="e"
                height="20"
                width="10"
              />
            </Flex>
          </Button>
        )}
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
    </BottomSheetModal>
  )
}

const ModalStyles = StyleSheet.create({
  gradient: {
    backgroundColor:
      'linear-gradient(180deg, rgba(156, 136, 159, 0.2) 0%, rgba(156, 136, 159, 0) 100%), #181B24;',
  },
})
