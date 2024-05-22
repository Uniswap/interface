import { Token } from '@ubeswap/sdk-core'
import React from 'react'
import styled from 'styled-components'

import useCurrencyLogoURIs from 'lib/hooks/useCurrencyLogoURIs'
import Logo from '../Logo'

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  background-color: ${({ theme }) => theme.white};
`

export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
}: {
  currency?: Token
  size?: string
  style?: React.CSSProperties
}) {
  const srcs: string[] = useCurrencyLogoURIs(currency)

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
}
