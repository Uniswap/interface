import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native-gesture-handler'
import QRCode from 'react-native-qrcode-svg'
import 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import CameraScan from 'src/assets/icons/camera-scan.svg'
import WalletConnectLogo from 'src/assets/icons/walletconnect.svg'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Spacer } from 'src/components/layout/Spacer'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { WalletQRCode } from 'src/components/modals/WalletQRCode'
import { Text } from 'src/components/Text'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { DappConnectionItem } from 'src/features/walletConnect/DappConnectionItem'
import { QRCodeScanner } from 'src/features/walletConnect/QRCodeScanner'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { connectToApp } from 'src/features/walletConnect/WalletConnect'
import { dimensions } from 'src/styles/sizing'
import { shortenAddress } from 'src/utils/addresses'

type Props = {
  isVisible: boolean
  onClose: () => void
}

export function WalletConnectScanSheet({ isVisible, onClose }: Props) {
  const { t } = useTranslation()
  const activeAccount = useActiveAccount()
  const { sessions } = useWalletConnect(activeAccount?.address)

  const [showQRModal, setShowQRModal] = useState(false)
  const [showConnectedDapps, setShowConnectedDapps] = useState(false)

  const onPressQRCode = () => setShowQRModal(true)
  const onCloseQrCode = () => setShowQRModal(false)
  const theme = useAppTheme()

  const onScanCode = (uri: string) => {
    if (!activeAccount) return

    connectToApp(uri, activeAccount.address)
    onClose()
  }

  if (!activeAccount) return null

  return (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      isVisible={isVisible}
      name={ModalName.WalletConnectScan}
      onClose={onClose}>
      <WalletQRCode
        address={activeAccount.address}
        isVisible={showQRModal}
        onClose={onCloseQrCode}
      />
      <Box flex={1}>
        <Flex
          centered
          gap="md"
          mt="sm"
          position="absolute"
          width={dimensions.fullWidth}
          zIndex="modal">
          <Box bg="gray400" borderRadius="sm" height={4} width={40} />
          <Flex row>
            <WalletConnectLogo height={30} width={30} />
            <Text color="textColor" variant="bodyLgBold">
              WalletConnect
            </Text>
          </Flex>
        </Flex>
        {/* This is temporary UI/UX and the mt is there because existing header is positioned absolute*/}
        {showConnectedDapps ? (
          <Flex grow mt="xxl" pt="lg">
            <FlatList
              ItemSeparatorComponent={() => <Spacer y="md" />}
              data={sessions}
              keyExtractor={(item) => item.id}
              renderItem={(item) => <DappConnectionItem wrapped={item} />}
            />
          </Flex>
        ) : (
          <QRCodeScanner
            numConnections={sessions.length}
            onPressConnections={() => setShowConnectedDapps(true)}
            onScanCode={onScanCode}
          />
        )}
      </Box>
      <Flex gap="sm" mb="xl" mt="md" mx="md">
        {showConnectedDapps ? (
          <Button
            backgroundColor="gray100"
            borderRadius="lg"
            name={ElementName.WalletConnectScan}
            p="md"
            onPress={() => setShowConnectedDapps(false)}>
            <Flex row alignItems="center" gap="sm">
              <CameraScan height={30} stroke={theme.colors.white} strokeWidth={20} width={40} />
              <Flex flexGrow={1} gap="xxs">
                <Text variant="bodyBold">{t('Scan code')}</Text>
                <Text variant="bodySmSoft">{t('Scan QR code for Wallet Connect')}</Text>
              </Flex>
              <Chevron color={theme.colors.textColor} direction="e" height="20" width="10" />
            </Flex>
          </Button>
        ) : (
          <Button
            backgroundColor="gray100"
            borderRadius="lg"
            name={ElementName.WCViewDappConnections}
            padding="md"
            onPress={() => setShowConnectedDapps(true)}>
            <Flex row alignItems="center" gap="sm">
              <CameraScan height={30} stroke={theme.colors.white} strokeWidth={20} width={40} />
              <Flex flexGrow={1} gap="xxs">
                <Text variant="bodyBold">{t('Show Connected Dapps')}</Text>
                <Text variant="bodySmSoft">
                  {sessions.length === 1
                    ? t('1 app connected')
                    : t('{{numConnections}} apps connected', { numConnections: sessions.length })}
                </Text>
              </Flex>
              <Chevron color={theme.colors.textColor} direction="e" height="20" width="10" />
            </Flex>
          </Button>
        )}
        <Button
          backgroundColor="gray100"
          borderRadius="lg"
          name={ElementName.QRCodeModalToggle}
          p="md"
          onPress={onPressQRCode}>
          <Flex row gap="sm">
            <Flex centered backgroundColor="white" borderRadius="sm" padding="xs">
              <QRCode size={30} value={activeAccount.address} />
            </Flex>
            <Flex flexGrow={1} gap="xxs">
              <Text variant="bodyBold">{t('Show my QR code')}</Text>
              <Text variant="bodySmSoft">{shortenAddress(activeAccount.address)}</Text>
            </Flex>
            <Chevron color={theme.colors.textColor} direction="e" height="20" width="10" />
          </Flex>
        </Button>
      </Flex>
    </BottomSheetModal>
  )
}
