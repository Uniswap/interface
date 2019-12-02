import React from 'react'
import styled from 'styled-components'
import QRCode from 'qrcode.react'
import { useDarkModeManager } from '../../contexts/LocalStorage'

const QRCodeWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 280px;
  height: 280px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid ${({ theme }) => theme.placeholderGray};
`

export default function WalletConnectData({ uri = '', size }) {
  const [isDark] = useDarkModeManager()
  return (
    <QRCodeWrapper>
      {uri && (
        <QRCode size={size} value={uri} bgColor={isDark ? '#333639' : 'white'} fgColor={isDark ? 'white' : 'black'} />
      )}
    </QRCodeWrapper>
  )
}
