import React from 'react'
import styled from 'styled-components'
import QRCode from 'qrcode.react'
import { useDarkModeManager } from '../../state/user/hooks'

const QRCodeWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-bottom: 20px;
`

interface WalletConnectDataProps {
  uri?: string
  size: number
}

export default function WalletConnectData({ uri = '', size }: WalletConnectDataProps) {
  const [isDark] = useDarkModeManager()
  return (
    <QRCodeWrapper>
      {uri && (
        <QRCode size={size} value={uri} bgColor={isDark ? '#333639' : 'white'} fgColor={isDark ? 'white' : 'black'} />
      )}
    </QRCodeWrapper>
  )
}
