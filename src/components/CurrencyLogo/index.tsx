import { Currency } from '@uniswap/sdk-core'
import useCurrencyLogoURIs from 'lib/hooks/useCurrencyLogoURIs'
import React from 'react'
import styled from 'styled-components/macro'

import Logo from '../Logo'

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background: radial-gradient(white 50%, #ffffff00 calc(75% + 1px), #ffffff00 100%);
  border-radius: 50%;
  -mox-box-shadow: 0 0 1px black;
  -webkit-box-shadow: 0 0 1px black;
  box-shadow: 0 0 1px black;
  border: 0px solid rgba(255, 255, 255, 0);
`

const StyledNativeLogo = styled(StyledLogo)`
  -mox-box-shadow: 0 0 1px white;
  -webkit-box-shadow: 0 0 1px white;
  box-shadow: 0 0 1px white;
`

export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
  ...rest
}: {
  currency?: Currency | null
  size?: string
  style?: React.CSSProperties
}) {
  const props = {
    alt: `${currency?.symbol ?? 'token'} logo`,
    size,
    srcs: useCurrencyLogoURIs(currency),
    style,
    ...rest,
  }

  return currency?.isNative ? <StyledNativeLogo {...props} /> : <StyledLogo {...props} />
}
