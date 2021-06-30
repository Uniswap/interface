import { Trans } from '@lingui/macro'
import arbitrumMaskUrl from 'assets/svg/arbitrum_mask.svg'
import optimismBannerBackgroundUrl from 'assets/images/optimism-banner-background.png'
import { NETWORK_LABELS, SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useState } from 'react'
import { ArrowDownCircle, X } from 'react-feather'
import { useArbitrumAlphaAlert } from 'state/user/hooks'
import { useETHBalances } from 'state/wallet/hooks'
import styled, { css } from 'styled-components'

const CloseIcon = styled(X)`
  cursor: pointer;
  position: absolute;
  top: 1em;
  right: 1em;
`
const BaseWrapper = css`
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  min-height: 212px;
  overflow: hidden;
  position: relative;
  width: 100%;
`
const ArbitrumWrapper = styled.div`
  ${BaseWrapper}
  background: radial-gradient(285.11% 8200.45% at 29.05% 48.94%, rgba(40, 160, 240, 0.1) 0%, rgba(219, 255, 0, 0) 100%),
    radial-gradient(76.02% 75.41% at 1.84% 0%, rgba(150, 190, 220, 0.3) 0%, rgba(33, 114, 229, 0.3) 100%);
  :before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: -1;
    background-image: url(${arbitrumMaskUrl});
    background-repeat: no-repeat;
  }
`
const NetworkTextStyles = styled.span`
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
const OptimismWrapper = styled.div`
  ${BaseWrapper}
  background: radial-gradient(circle at top left, hsla(295, 100%, 50%, 0.5) 0%, hsla(357, 91%, 49%, 0.8) 100%),
  radial-gradient(circle at bottom left, hsla(0, 0%, 0%, 0.2) 0%, hsla(0, 100%, 50%, 0.5) 100%);
  :before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: -1;
    background-image: url(${optimismBannerBackgroundUrl});
    background-repeat: no-repeat;
    transform: translate(21%, 12%) scale(1.5);
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
  if (arbitrumAlphaAcknowledged || locallyDismissed || !chainId) {
    return null
  }
  const Content = ({ bridgeUrl }: { bridgeUrl: string }) => (
    <>
      <CloseIcon onClick={dismiss} />
      <Header>
        <Trans>
          Uniswap on <NetworkTextStyles>{NETWORK_LABELS[chainId]}</NetworkTextStyles>
        </Trans>
      </Header>
      <Body>
        <Trans>
          This is an alpha release of Uniswap on the {NETWORK_LABELS[chainId]} network. You must bridge L1 assets to the
          network to swap them.
        </Trans>
      </Body>
      <LinkOutToBridge href={bridgeUrl} target="_blank" rel="noopener noreferrer">
        <Trans>Deposit to {NETWORK_LABELS[chainId]}</Trans>
        <LinkOutCircle />
      </LinkOutToBridge>
    </>
  )
  if (chainId === SupportedChainId.ARBITRUM_ONE) {
    return (
      <ArbitrumWrapper>
        <Content bridgeUrl="https://bridge.arbitrum.io/" />
      </ArbitrumWrapper>
    )
  }
  if (chainId === SupportedChainId.OPTIMISM) {
    return (
      <OptimismWrapper>
        <Content bridgeUrl="https://gateway.optimism.io/" />
      </OptimismWrapper>
    )
  }
  return null
}
