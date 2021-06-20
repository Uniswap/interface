import { Trans } from '@lingui/macro'
import arbitrumMaskUrl from 'assets/svg/arbitrum_mask.svg'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import React, { useCallback, useState } from 'react'
import { ArrowDownCircle, X } from 'react-feather'
import { useArbitrumAlphaAlert } from 'state/user/hooks'
import { useETHBalances } from 'state/wallet/hooks'
import styled from 'styled-components'

const CloseIcon = styled(X)`
  cursor: pointer;
  position: absolute;
  top: 1em;
  right: 1em;
`
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
const LinkOutToBridge = styled.a`
  align-items: center;
  background-color: black;
  border-radius: 16px;
  color: white;
  display: flex;
  justify-content: space-between;
  margin: 0 18px 18px 18px;
  padding: 14px 24px;
  text-decoration: none;
  width: auto;
  :hover,
  :focus,
  :active {
    background-color: black;
  }
`
export function SwapNetworkAlert() {
  const { account, chainId } = useActiveWeb3React()
  const [arbitrumAlphaAcknowledged, setArbitrumAlphaAcknowledged] = useArbitrumAlphaAlert()
  const [locallyDismissed, setLocallyDimissed] = useState(false)
  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']

  const dismiss = useCallback(() => {
    if (userEthBalance?.greaterThan(0)) {
      setArbitrumAlphaAcknowledged(true)
    } else {
      setLocallyDimissed(true)
    }
  }, [setArbitrumAlphaAcknowledged, userEthBalance])
  if (chainId !== SupportedChainId.ARBITRUM_ONE || arbitrumAlphaAcknowledged || locallyDismissed) {
    return null
  }
  return (
    <Wrapper>
      <CloseIcon onClick={dismiss} />
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
      <LinkOutToBridge href="https://bridge.arbitrum.io/" target="_blank" rel="noopener noreferrer">
        <Trans>Deposit to Arbitrum</Trans>
        <LinkOutCircle />
      </LinkOutToBridge>
    </Wrapper>
  )
}
