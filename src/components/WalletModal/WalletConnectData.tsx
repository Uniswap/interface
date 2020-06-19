import React, { useEffect } from 'react'
import styled from 'styled-components'
import QRCode from 'qrcode.react'
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal'
import { isMobile } from 'react-device-detect'
import { useWeb3React } from '@web3-react/core'
import { walletconnect } from '../../connectors'

const QRCodeWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-bottom: 20px;
`

const StyledQRCode = styled(QRCode)`
  border: 3px solid white;
`

interface WalletConnectDataProps {
  uri?: string
  size: number
}

export default function WalletConnectData({ uri = '', size }: WalletConnectDataProps) {
  const { active, connector } = useWeb3React()

  useEffect(() => {
    if (active && connector === walletconnect) {
      WalletConnectQRCodeModal.close()
    } else {
      WalletConnectQRCodeModal.open(uri, null)
    }
  }, [active, uri, connector])

  if (!isMobile) {
    return <QRCodeWrapper>{uri && <StyledQRCode size={size} value={uri} />}</QRCodeWrapper>
  } else {
    return <div></div>
  }
}
