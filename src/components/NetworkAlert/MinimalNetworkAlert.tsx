import { Trans } from '@lingui/macro'
import arbitrumIconUrl from 'assets/svg/arbitrum_logo.svg'
import {
  ArbitrumWrapperBackgroundDarkMode,
  ArbitrumWrapperBackgroundLightMode,
} from 'components/NetworkAlert/NetworkAlert'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { ArrowDownCircle } from 'react-feather'
import { useArbitrumAlphaAlert, useDarkModeManager } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'

const ArbitrumIcon = styled.img`
  display: none;
  height: 42px;
  margin: auto 20px auto 5px;
  width: 42px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
  }
`
const DesktopTextBreak = styled.div`
  display: none;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToMedium}px) {
    display: block;
  }
`
const Wrapper = styled.div<{ darkMode: boolean }>`
  ${({ darkMode }) => (darkMode ? ArbitrumWrapperBackgroundDarkMode : ArbitrumWrapperBackgroundLightMode)};
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px;
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
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    flex-direction: row;
    padding: 16px 20px;
  }
`
const Body = styled.p`
  line-height: 143%;
  margin: 12px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    margin: 16px 20px 31px;
    flex: 1 1 auto;
    margin: 0;
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
  margin: 0;
  max-height: 47px;
  padding: 14px;
  text-decoration: none;
  width: auto;
  :hover,
  :focus,
  :active {
    background-color: black;
  }
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    margin: auto 0 auto auto;
    padding: 14px 17px;
    min-width: 226px;
  }
`
export function MinimalNetworkAlert() {
  const { chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  const [arbitrumAlphaAcknowledged] = useArbitrumAlphaAlert()

  if (chainId !== SupportedChainId.ARBITRUM_ONE || arbitrumAlphaAcknowledged) {
    return null
  }
  return (
    <Wrapper darkMode={darkMode}>
      <ArbitrumIcon src={arbitrumIconUrl} />
      <Body>
        <Trans>This is an alpha release of Uniswap on the Arbitrum network.</Trans>
        <DesktopTextBreak /> <Trans>You must bridge L1 assets to the network to swap them.</Trans>
      </Body>
      <LinkOutToBridge href="https://bridge.arbitrum.io/" target="_blank" rel="noopener noreferrer">
        <Trans>Deposit to Arbitrum</Trans>
        <LinkOutCircle />
      </LinkOutToBridge>
    </Wrapper>
  )
}
