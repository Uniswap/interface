import { Trans } from '@lingui/macro'
import { Connector } from '@web3-react/types'
import { sendAnalyticsEvent } from 'analytics'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { scantasticConnectConnection } from 'connection'
import { ActivationStatus, useActivationState } from 'connection/activate'
import { ConnectionType } from 'connection/types'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'
import { isIOS } from 'utils/userAgent'

import uniPng from '../../assets/images/uniwallet_modal_icon.png'

const ScantasticConnectWrapper = styled(RowBetween)`
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

export default function ScantasticModal() {
  const { activationState, cancelActivation } = useActivationState()
  const [uri, setUri] = useState<string>()

  // Displays the modal if not on iOS, a Uniswap Wallet Connection is pending, & qrcode URI is available
  const open =
    !isIOS &&
    activationState.status === ActivationStatus.PENDING &&
    activationState.connection.type === ConnectionType.SCANTASTIC &&
    !!uri

  useEffect(() => {
    const scantastic = scantasticConnectConnection.connector as Connector & {
      requestScantasticUri: () => Promise<string>
    }
    scantastic.requestScantasticUri?.().then((uri) => {
      uri && setUri(uri)
    })
  }, [])

  useEffect(() => {
    if (open) sendAnalyticsEvent('Scantastic wallet modal opened')
  }, [open])

  const theme = useTheme()
  return (
    <Modal isOpen={open} onDismiss={cancelActivation}>
      <ScantasticConnectWrapper>
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
              fgColor={theme.darkMode ? theme.surface1 : theme.black}
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
      </ScantasticConnectWrapper>
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
          <Trans>Don&apos;t have Scantastic?</Trans>
        </ThemedText.SubHeaderSmall>
        <ThemedText.BodySmall color="neutral2">
          <Trans>Ask your friendly neighborhood Spiderman.</Trans>
        </ThemedText.BodySmall>
      </AutoColumn>
    </InfoSectionWrapper>
  )
}
