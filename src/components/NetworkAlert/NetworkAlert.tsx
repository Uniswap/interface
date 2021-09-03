import { Trans } from '@lingui/macro'
import { L2_CHAIN_IDS, SupportedChainId, SupportedL2ChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useState } from 'react'
import { ArrowDownCircle, X } from 'react-feather'
import { useArbitrumAlphaAlert, useDarkModeManager } from 'state/user/hooks'
import { useETHBalances } from 'state/wallet/hooks'
import styled, { css } from 'styled-components/macro'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { CHAIN_INFO } from '../../constants/chains'
import { ReadMoreLink } from './styles'

const L2Icon = styled.img`
  width: 40px;
  height: 40px;
  justify-self: center;
`
const CloseIcon = styled(X)`
  cursor: pointer;
  position: absolute;
  top: 16px;
  right: 16px;
`
const ContentWrapper = styled.div`
  align-items: center;
  display: grid;
  grid-gap: 4px;
  grid-template-columns: 40px 4fr;
  grid-template-rows: auto auto;
  margin: 20px 16px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    grid-template-columns: 42px 4fr;
    grid-gap: 8px;
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
export const OptimismWrapperBackgroundDarkMode = css`
  background: radial-gradient(948% 292% at 42% 0%, rgba(255, 58, 212, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%),
    radial-gradient(98% 96% at 2% 0%, rgba(255, 39, 39, 0.5) 0%, rgba(235, 0, 255, 0.345) 96%);
`
export const OptimismWrapperBackgroundLightMode = css`
  background: radial-gradient(92% 105% at 50% 7%, rgba(255, 58, 212, 0.04) 0%, rgba(255, 255, 255, 0.03) 100%),
    radial-gradient(100% 97% at 0% 12%, rgba(235, 0, 255, 0.1) 0%, rgba(243, 19, 19, 0.1) 100%), hsla(0, 0%, 100%, 0.5);
`
const RootWrapper = styled.div<{ chainId: SupportedChainId; darkMode: boolean; logoUrl: string }>`
  ${({ chainId, darkMode }) =>
    [SupportedChainId.OPTIMISM, SupportedChainId.OPTIMISTIC_KOVAN].includes(chainId)
      ? darkMode
        ? OptimismWrapperBackgroundDarkMode
        : OptimismWrapperBackgroundLightMode
      : darkMode
      ? ArbitrumWrapperBackgroundDarkMode
      : ArbitrumWrapperBackgroundLightMode};
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  min-height: 174px;
  overflow: hidden;
  position: relative;
  width: 100%;

  :before {
    background-image: url(${({ logoUrl }) => logoUrl});
    background-repeat: no-repeat;
    background-size: 300px;
    content: '';
    height: 300px;
    opacity: 0.1;
    position: absolute;
    transform: rotate(25deg) translate(-90px, -40px);
    width: 300px;
    z-index: -1;
  }
`
const Header = styled.h2`
  font-weight: 600;
  font-size: 20px;
  margin: 0;
  padding-right: 30px;
`
const Body = styled.p`
  font-size: 12px;
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
const LinkOutToBridge = styled(ExternalLink)`
  align-items: center;
  background-color: black;
  border-radius: 16px;
  color: white;
  display: flex;
  font-size: 16px;
  height: 44px;
  justify-content: space-between;
  margin: 0 20px 20px 20px;
  padding: 12px 16px;
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
  if (!chainId || !L2_CHAIN_IDS.includes(chainId) || arbitrumAlphaAcknowledged || locallyDismissed) {
    return null
  }
  const info = CHAIN_INFO[chainId as SupportedL2ChainId]
  const isOptimism = [SupportedChainId.OPTIMISM, SupportedChainId.OPTIMISTIC_KOVAN].includes(chainId)
  const depositUrl = isOptimism ? `${info.bridge}?chainId=1` : info.bridge
  const readMoreLink = isOptimism
    ? 'https://help.uniswap.org/en/articles/5392809-how-to-deposit-tokens-to-optimism'
    : 'https://help.uniswap.org/en/articles/5538618-how-to-deposit-tokens-to-arbitrum'
  return (
    <RootWrapper chainId={chainId} darkMode={darkMode} logoUrl={info.logoUrl}>
      <CloseIcon onClick={dismiss} />
      <ContentWrapper>
        <L2Icon src={info.logoUrl} />
        <Header>
          <Trans>Uniswap on {info.label}</Trans>
        </Header>
        <Body>
          <Trans>
            This is an alpha release of Uniswap on the {info.label} network. You must bridge L1 assets to the network to
            swap them.
          </Trans>{' '}
          <ReadMoreLink href={readMoreLink}>
            <Trans>Read more</Trans>
          </ReadMoreLink>
        </Body>
      </ContentWrapper>
      <LinkOutToBridge href={depositUrl}>
        <Trans>Deposit to {info.label}</Trans>
        <LinkOutCircle />
      </LinkOutToBridge>
    </RootWrapper>
  )
}
