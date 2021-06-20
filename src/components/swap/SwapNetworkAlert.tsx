import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'

const Wrapper = styled.div`
  width: 425px;
`
const Header = styled.h3``

export function SwapNetworkAlert() {
  return (
    <Wrapper>
      <Header>
        <Trans>Uniswap on Arbitrum</Trans>
      </Header>
    </Wrapper>
  )
}
