import React, { useMemo } from 'react'
import styled from 'styled-components'

import Logo from '../Logo'

const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
`

export default function CurrencyLogo({
  address,
  size = '24px',
  style
}: {
  address: string
  size?: string
  style?: React.CSSProperties
}) {
  const srcs: string[] = useMemo(() => {
    return [getTokenLogoURL(address)]
  }, [address])

  return <StyledLogo size={size} srcs={srcs} alt={`${address ?? 'token'} logo`} style={style} />
}
