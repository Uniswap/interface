import React from 'react'
import CurrencyLogo from '../CurrencyLogo'
import styled from 'styled-components'
import { TYPE } from '../../theme'
import { Currency } from '@fuseio/fuse-swap-sdk'
import { safeShortenAddress } from '../../utils'
import { WrappedTokenInfo } from '../../state/lists/hooks'
import Copy from '../AccountDetails/Copy'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
`

const Content = styled.div`
  margin-left: 0.5rem;
`

const Address = styled.span`
  margin-left: 4px;
`

export default function Token({ token, addressColor }: { token: Currency | undefined; addressColor?: string }) {
  const wrappedToken = token as WrappedTokenInfo
  return (
    <Wrapper>
      <CurrencyLogo currency={wrappedToken} size="40px" />
      <Content>
        <TYPE.body>{wrappedToken?.symbol}</TYPE.body>
        <TYPE.body color={addressColor}>
          <Copy toCopy={wrappedToken?.address} color={addressColor} fontSize="16px" paddingLeft="0">
            <Address>{safeShortenAddress(wrappedToken?.address)}</Address>
          </Copy>
        </TYPE.body>
      </Content>
    </Wrapper>
  )
}
