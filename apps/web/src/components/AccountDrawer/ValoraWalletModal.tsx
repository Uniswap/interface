import { WalletConnect as WalletConnectv2 } from '@web3-react/walletconnect-v2'
import Column, { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { valoraConnectConnection } from 'connection'
import { ValoraConnect } from 'connection/WalletConnectV2'
import { ActivationStatus, useActivationState } from 'connection/activate'
import { ConnectionType } from 'connection/types'
import { Trans } from 'i18n'
import { QRCodeSVG } from 'qrcode.react'
import { PropsWithChildren, useEffect, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { ClickableStyle, CloseIcon, ThemedText } from 'theme/components'
import { isWebAndroid, isWebIOS } from 'uniswap/src/utils/platform'

import uniPng from '../../assets/wallets/valora-icon.png'

const StyledButton = styled.button<{ padded?: boolean; branded?: boolean }>`
  ${ClickableStyle}
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: row;
  gap: 6px;
  padding: 8px 24px;
  border: none;
  white-space: nowrap;
  background: ${({ theme, branded }) => (branded ? theme.accent1 : theme.surface3)};
  border-radius: 12px;

  font-weight: 535;
  font-size: 14px;
  line-height: 16px;
  color: ${({ theme, branded }) => (branded ? theme.deprecated_accentTextLightPrimary : theme.neutral1)};
`

function BaseButton({ onClick, branded, children }: PropsWithChildren<{ onClick?: () => void; branded?: boolean }>) {
  return (
    <StyledButton branded={branded} onClick={onClick}>
      {children}
    </StyledButton>
  )
}

const ValoraWalletConnectWrapper = styled(RowBetween)`
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

export default function ValoraWalletModal() {
  const { activationState, cancelActivation } = useActivationState()
  const [uri, setUri] = useState<string>()

  // Displays the modal if not on iOS/Android, a Valora Connection is pending, & qrcode URI is available
  const onLaunchedMobilePlatform = isWebIOS || isWebAndroid
  const open =
    !onLaunchedMobilePlatform &&
    activationState.status === ActivationStatus.PENDING &&
    activationState.connection.type === ConnectionType.VALORA &&
    !!uri

  useEffect(() => {
    const connectorV2 = valoraConnectConnection.connector as WalletConnectv2
    connectorV2.events.addListener(ValoraConnect.VALORA_URI_AVAILABLE, (uri: string) => {
      uri && setUri(uri)
    })
  }, [])

  // useEffect(() => {
  //   if (open) sendAnalyticsEvent(InterfaceEventName.UNIWALLET_CONNECT_MODAL_OPENED)
  // }, [open])

  const theme = useTheme()
  return (
    <Modal isOpen={open} onDismiss={cancelActivation}>
      <ValoraWalletConnectWrapper>
        <HeaderRow>
          <ThemedText.SubHeader>
            <Trans>Scan with Valora</Trans>
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
              fgColor={theme.darkMode ? theme.surface1 : theme.black}
              imageSettings={{
                src: uniPng,
                height: 30,
                width: 30,
                excavate: true,
              }}
            />
          )}
        </QRCodeWrapper>
        <Divider />
        <InfoSection />
      </ValoraWalletConnectWrapper>
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
  const onButtonClick = () => {
    window.open('https://valora.xyz/', '_blank')
  }
  return (
    <InfoSectionWrapper>
      <AutoColumn gap="4px">
        <ThemedText.SubHeaderSmall color="neutral1">
          <Trans>Don&apos;t have a Valora?</Trans>
        </ThemedText.SubHeaderSmall>
        <ThemedText.BodySmall color="neutral2">
          <Trans>Valora is Calo native easy to use mobile wallet. Available on iOS and Android.</Trans>
        </ThemedText.BodySmall>
      </AutoColumn>
      <Column>
        <BaseButton onClick={onButtonClick}>Get Valora</BaseButton>
      </Column>
    </InfoSectionWrapper>
  )
}
