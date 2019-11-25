import React from 'react'
import styled from 'styled-components'
import QRCode from 'qrcode.react'
import Option from './Option'
import { useDarkModeManager } from '../../contexts/LocalStorage'

const QRSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  h5 {
    padding-bottom: 1rem;
  }
`

const QRCodeWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 280px;
  height: 280px;
  border-radius: 20px;
  margin-bottom: 20px;
  border: 1px solid ${({ theme }) => theme.placeholderGray};
`

export default function QrCode({ uri, size, header, subheader, icon }) {
  const [isDark] = useDarkModeManager()

  return (
    <QRSection>
      <h5>Scan QR code with a compatible wallet</h5>
      <QRCodeWrapper>
        {uri && (
          <QRCode size={size} value={uri} bgColor={isDark ? '#333639' : 'white'} fgColor={isDark ? 'white' : 'black'} />
        )}
      </QRCodeWrapper>
      <Option color={'#4196FC'} header={header} subheader={subheader} icon={icon} />
    </QRSection>
  )
}
