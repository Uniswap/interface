import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import arbitrumMaskUrl from 'assets/svg/arbitrum_mask.svg'
import { Button as DefaultButton } from 'theme'
import { ArrowDownCircle } from 'react-feather'

const Wrapper = styled.div`
  border-radius: 20px;
  background: radial-gradient(285.11% 8200.45% at 29.05% 48.94%, rgba(40, 160, 240, 0.1) 0%, rgba(219, 255, 0, 0) 100%),
    radial-gradient(76.02% 75.41% at 1.84% 0%, rgba(150, 190, 220, 0.3) 0%, rgba(33, 114, 229, 0.3) 100%);
  display: flex;
  flex-direction: column;
  max-width: 480px;
  min-height: 212px;
  overflow: hidden;
  position: relative;
  width: 100%;

  :before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: -1;
    background-image: url(${arbitrumMaskUrl});
    background-repeat: no-repeat;
    transform: rotate(15deg), scale(1);
  }
`
const ArbitrumTextStyles = styled.span`
  font-style: italic;
  font-weight: 900;
  color: #f3de1e;
  background: linear-gradient(to right, #f3de1e, #ffffff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`
const Header = styled.h3`
  margin: 0;
  padding: 20px 20px 0;
`
const Body = styled.p`
  line-height: 143%;
  margin: 16px 20px 31px;
`
const LinkOutCircle = styled(ArrowDownCircle)`
  transform: rotate(230deg);
  width: 20px;
  height: 20px;
`
const Button = styled(DefaultButton)`
  align-items: center;
  background-color: black;
  color: white;
  display: flex;
  justify-content: space-between;
  margin: 0 18px 18px 18px;
  width: auto;
  :hover,
  :focus,
  :active {
    background-color: black;
  }
`
export function SwapNetworkAlert() {
  return (
    <Wrapper>
      <Header>
        <Trans>
          Uniswap on <ArbitrumTextStyles>Arbitrum</ArbitrumTextStyles>
        </Trans>
      </Header>
      <Body>
        <Trans>
          This is an alpha release of Uniswap on the Arbitrum network. You must bridge L1 assets to the network to swap
          them.
        </Trans>
      </Body>
      <Button>
        Deposit to Arbitrum
        <LinkOutCircle />
      </Button>
    </Wrapper>
  )
}
