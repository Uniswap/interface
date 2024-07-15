import { InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import MobileAppLogo from 'assets/svg/mobile-app-qr-logo.svg'
import { DownloadButton } from 'components/AccountDrawer/DownloadButton'
import Column, { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { useConnectorWithId } from 'components/WalletModal/useOrderedConnections'
import { CONNECTION } from 'components/Web3Provider/constants'
import { useConnect } from 'hooks/useConnect'
import { Trans } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useState } from 'react'
import { CloseIcon, ThemedText } from 'theme/components'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isWebAndroid, isWebIOS } from 'utilities/src/platform'

const UniwalletConnectWrapper = styled(RowBetween)`
  display: flex;
  flex-direction: column;
  padding: 20px 16px 16px;
`
const HeaderRow = styled(RowBetween)`
  display: flex;
`
const QRCodeWrapper = styled(RowBetween)`
  aspect-ratio: 1;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.white};
  margin: 24px 32px 20px;
  padding: 10px;
`
const Divider = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
  width: 100%;
`

export default function UniwalletModal() {
  const [uri, setUri] = useState<string>()
  const connection = useConnect()

  // Displays the modal if not on iOS/Android, a Uniswap Wallet Connection is pending, & qrcode URI is available
  const onLaunchedMobilePlatform = isWebIOS || isWebAndroid
  const open = !onLaunchedMobilePlatform && !!uri && connection.isPending

  const uniswapWalletConnectConnector = useConnectorWithId(CONNECTION.UNISWAP_WALLET_CONNECT_CONNECTOR_ID, {
    shouldThrow: true,
  })

  useEffect(() => {
    function listener({ type, data }: { type: string; data?: unknown }) {
      if (type === 'display_uniswap_uri' && typeof data === 'string') {
        setUri(data)
      }
    }

    uniswapWalletConnectConnector.emitter.on('message', listener)

    return () => {
      uniswapWalletConnectConnector.emitter.off('message', listener)
    }
  }, [uniswapWalletConnectConnector.emitter])

  const close = useCallback(() => {
    connection?.reset()
    setUri(undefined)
  }, [connection])

  useEffect(() => {
    if (open) {
      sendAnalyticsEvent(InterfaceEventName.UNIWALLET_CONNECT_MODAL_OPENED)
    } else {
      setUri(undefined)
    }
  }, [open])

  const theme = useTheme()
  return (
    <Modal isOpen={open} onDismiss={close}>
      <UniwalletConnectWrapper>
        <HeaderRow>
          <ThemedText.SubHeader>
            <Trans i18nKey="account.drawer.modal.scan" />
          </ThemedText.SubHeader>
          <CloseIcon onClick={close} />
        </HeaderRow>
        <QRCodeWrapper>
          {uri && (
            <QRCodeSVG
              value={uri}
              width="100%"
              height="100%"
              level="M"
              fgColor={theme.darkMode ? theme.surface1 : theme.black}
              imageSettings={{
                src: MobileAppLogo,
                height: 33,
                width: 33,
                excavate: false,
              }}
            />
          )}
        </QRCodeWrapper>
        <Divider />
        <InfoSection />
      </UniwalletConnectWrapper>
    </Modal>
  )
}

const InfoSectionWrapper = styled(RowBetween)`
  display: flex;
  flex-direction: row;
  padding-top: 20px;
  gap: 20px;
`

function InfoSection() {
  return (
    <InfoSectionWrapper>
      <AutoColumn gap="4px">
        <ThemedText.SubHeaderSmall color="neutral1">
          <Trans i18nKey="account.drawer.modal.dont" />
        </ThemedText.SubHeaderSmall>
        <ThemedText.BodySmall color="neutral2">
          <Trans i18nKey="account.drawer.modal.body" />
        </ThemedText.BodySmall>
      </AutoColumn>
      <Column>
        <DownloadButton element={InterfaceElementName.UNISWAP_WALLET_MODAL_DOWNLOAD_BUTTON} />
      </Column>
    </InfoSectionWrapper>
  )
}
