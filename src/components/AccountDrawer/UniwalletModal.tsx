import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { WalletConnect } from '@web3-react/walletconnect'
import { WalletConnect as WalletConnectv2 } from '@web3-react/walletconnect-v2'
import Column, { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { uniwalletConnectConnection, uniwalletWCV2ConnectConnection } from 'connection'
import { ActivationStatus, useActivationState } from 'connection/activate'
import { ConnectionType } from 'connection/types'
import { UniwalletConnect } from 'connection/WalletConnect'
import { UniwalletConnect as UniwalletConnectV2 } from 'connection/WalletConnectV2'
import { useWalletConnectV2AsDefault } from 'featureFlags/flags/walletConnectV2'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import styled, { useTheme } from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'

import uniPng from '../../assets/images/uniwallet_modal_icon.png'
import { DownloadButton } from './DownloadButton'

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
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  width: 100%;
`

export default function UniwalletModal() {
  const { activationState, cancelActivation } = useActivationState()
  const [uri, setUri] = useState<string>()

  // Displays the modal if a Uniswap Wallet Connection is pending & qrcode URI is available
  const uniswapWalletConnectors = [ConnectionType.UNISWAP_WALLET, ConnectionType.UNISWAP_WALLET_V2]
  const open =
    activationState.status === ActivationStatus.PENDING &&
    uniswapWalletConnectors.includes(activationState.connection.type) &&
    !!uri

  const walletConnectV2AsDefault = useWalletConnectV2AsDefault()

  useEffect(() => {
    if (walletConnectV2AsDefault) {
      const connectorV2 = uniwalletWCV2ConnectConnection.connector as WalletConnectv2
      connectorV2.events.addListener(UniwalletConnectV2.UNI_URI_AVAILABLE, (uri: string) => {
        uri && setUri(uri)
      })
    } else {
      const connectorV1 = uniwalletConnectConnection.connector as WalletConnect
      connectorV1.events.addListener(UniwalletConnect.UNI_URI_AVAILABLE, (uri: string) => {
        uri && setUri(uri)
      })
    }
  }, [walletConnectV2AsDefault])

  useEffect(() => {
    if (open) sendAnalyticsEvent('Uniswap wallet modal opened')
  }, [open])

  const theme = useTheme()
  return (
    <Modal isOpen={open} onDismiss={cancelActivation}>
      <UniwalletConnectWrapper>
        <HeaderRow>
          <ThemedText.SubHeader>
            <Trans>Scan with Uniswap Wallet</Trans>
          </ThemedText.SubHeader>
          <CloseIcon onClick={cancelActivation} />
        </HeaderRow>
        <QRCodeWrapper>
          {uri && (
            <QRCodeSVG
              value={uri}
              width="100%"
              height="100%"
              level="M"
              fgColor={theme.darkMode ? theme.backgroundSurface : theme.black}
              imageSettings={{
                src: uniPng,
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
        <ThemedText.SubHeaderSmall color="textPrimary">
          <Trans>Don&apos;t have Uniswap Wallet?</Trans>
        </ThemedText.SubHeaderSmall>
        <ThemedText.Caption color="textSecondary">
          <Trans>
            Download in the App Store to safely store your tokens and NFTs, swap tokens, and connect to crypto apps.
          </Trans>
        </ThemedText.Caption>
      </AutoColumn>
      <Column>
        <DownloadButton element={InterfaceElementName.UNISWAP_WALLET_MODAL_DOWNLOAD_BUTTON} />
      </Column>
    </InfoSectionWrapper>
  )
}
