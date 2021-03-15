import React from 'react'
import CurrencyLogo from '../CurrencyLogo'
import styled from 'styled-components'
import { TYPE } from '../../theme'
import { Currency } from '@fuseio/fuse-swap-sdk'
import { safeShortenAddress } from '../../utils'
import { WrappedTokenInfo } from '../../state/lists/hooks'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
`

const Content = styled.div`
  margin-left: 0.5rem;
`

export default function Token({ token, addressColor }: { token: Currency | undefined; addressColor?: string }) {
  const wrappedToken = token as WrappedTokenInfo
  return (
    <Wrapper>
      <CurrencyLogo currency={wrappedToken} size="40px" />
      <Content>
        <TYPE.body>{wrappedToken?.symbol}</TYPE.body>
        <TYPE.body color={addressColor}>{safeShortenAddress(wrappedToken?.address)}</TYPE.body>
      </Content>
    </Wrapper>
  )
}
