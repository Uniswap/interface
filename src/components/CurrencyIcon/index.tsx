import React from 'react'
import styled from 'styled-components'

import Logo from '../Logo'

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
`

export default function CurrencyLogo({
  logo0,
  size = '24px',
  style
}: {
  logo0?: string
  size?: string
  style?: React.CSSProperties
}) {
  return <StyledLogo size={size} srcs={[logo0 ?? '']} alt={`${logo0 ?? 'token'} logo`} style={style} />
}
