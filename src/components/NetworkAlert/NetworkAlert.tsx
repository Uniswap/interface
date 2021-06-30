import { Trans } from '@lingui/macro'
import arbitrumIconUrl from 'assets/svg/arbitrum_logo.svg'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useState } from 'react'
import { ArrowDownCircle, X } from 'react-feather'
import { useArbitrumAlphaAlert, useDarkModeManager } from 'state/user/hooks'
import { useETHBalances } from 'state/wallet/hooks'
import styled, { css } from 'styled-components/macro'
import { MEDIA_WIDTHS, TYPE } from 'theme'

const ArbitrumIcon = styled.img`
  width: 42px;
  height: 42px;
  justify-self: center;
`
const CloseIcon = styled(X)`
  cursor: pointer;
  position: absolute;
  top: 12px;
  right: 12px;
`
const ContentWrapper = styled.div`
  align-items: center;
  display: grid;
  grid-gap: 4px;
  grid-template-columns: 40px 4fr;
  grid-template-rows: auto auto;
  margin: 21px 15px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    grid-template-columns: 58px 4fr;
    grid-gap: 6px;
  }
`
export const ArbitrumWrapperBackgroundDarkMode = css`
  background: radial-gradient(285% 8200% at 30% 50%, rgba(40, 160, 240, 0.1) 0%, rgba(219, 255, 0, 0) 100%),
    radial-gradient(75% 75% at 0% 0%, rgba(150, 190, 220, 0.3) 0%, rgba(33, 114, 229, 0.3) 100%), hsla(0, 0%, 100%, 0.1);
`
export const ArbitrumWrapperBackgroundLightMode = css`
  background: radial-gradient(285% 8200% at 30% 50%, rgba(40, 160, 240, 0.1) 0%, rgba(219, 255, 0, 0) 100%),
    radial-gradient(circle at top left, hsla(206, 50%, 75%, 0.01), hsla(215, 79%, 51%, 0.12)), hsla(0, 0%, 100%, 0.1);
`
const RootWrapper = styled.div<{ darkMode: boolean }>`
  ${({ darkMode }) => (darkMode ? ArbitrumWrapperBackgroundDarkMode : ArbitrumWrapperBackgroundLightMode)};
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  min-height: 218px;
  overflow: hidden;
  position: relative;
  width: 100%;

  :before {
    background-image: url(${arbitrumIconUrl});
    background-repeat: no-repeat;
    content: '';
    height: 300px;
    opacity: 0.1;
    position: absolute;
    transform: rotate(25deg) translate(-90px, -8px);
    width: 300px;
    z-index: -1;
  }
`
const Header = styled(TYPE.largeHeader)`
  margin: 0;
`
const Body = styled.p`
  grid-column: 1 / 3;
  line-height: 143%;
  margin: 0;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    grid-column: 2 / 3;
  }
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
export function NetworkAlert() {
  const { account, chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
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
    <RootWrapper darkMode={darkMode}>
      <CloseIcon onClick={dismiss} />
      <ContentWrapper>
        <ArbitrumIcon src={arbitrumIconUrl} />
        <Header>
          <Trans>Uniswap on Arbitrum</Trans>
        </Header>
        <Body>
          <Trans>
            This is an alpha release of Uniswap on the Arbitrum network. You must bridge L1 assets to the network to
            swap them.
          </Trans>
        </Body>
      </ContentWrapper>
      <LinkOutToBridge href="https://bridge.arbitrum.io/" target="_blank" rel="noopener noreferrer">
        <Trans>Deposit to Arbitrum</Trans>
        <LinkOutCircle />
      </LinkOutToBridge>
    </RootWrapper>
  )
}
