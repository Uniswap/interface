import { Trans } from '@lingui/macro'
import { SupportedChainId, SupportedL2ChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useMemo, useState } from 'react'
import { ArrowDownCircle, X } from 'react-feather'
import { useDarkModeManager, useNetworkAlertStatus } from 'state/user/hooks'
import { useETHBalances } from 'state/wallet/hooks'
import styled, { css } from 'styled-components/macro'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

import { CHAIN_INFO } from '../../constants/chains'
import { isL2ChainId } from '../../utils/chains'

const L2Icon = styled.img`
  width: 36px;
  height: 36px;
  justify-self: center;
`
const BetaTag = styled.span<{ color: string }>`
  align-items: center;
  background-color: ${({ color }) => color};
  border-radius: 6px;
  color: ${({ theme }) => theme.white};
  display: flex;
  font-size: 14px;
  height: 28px;
  justify-content: center;
  left: -16px;
  position: absolute;
  transform: rotate(-15deg);
  top: -16px;
  width: 60px;
  z-index: 1;
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
export const Controls = styled.div<{ thin?: boolean }>`
  align-items: center;
  display: flex;
  justify-content: flex-start;
  ${({ thin }) =>
    thin &&
    css`
      margin: auto 32px auto 0;
    `}
`
const CloseIcon = styled(X)`
  cursor: pointer;
  position: absolute;
  top: 16px;
  right: 16px;
`
const BodyText = styled.div`
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
const LearnMoreLink = styled(ExternalLink)<{ thin?: boolean }>`
  align-items: center;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  color: ${({ theme }) => theme.text1};
  display: flex;
  font-size: 16px;
  height: 44px;
  justify-content: space-between;
  margin: 0 0 20px 0;
  padding: 12px 16px;
  text-decoration: none;
  width: auto;
  :hover,
  :focus,
  :active {
    background-color: rgba(255, 255, 255, 0.05);
  }
  transition: background-color 150ms ease-in-out;
  ${({ thin }) =>
    thin &&
    css`
      font-size: 14px;
      margin: auto;
      width: 112px;
    `}
`
const RootWrapper = styled.div`
  position: relative;
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
const ContentWrapper = styled.div<{ chainId: SupportedChainId; darkMode: boolean; logoUrl: string; thin?: boolean }>`
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
  ${({ thin }) =>
    thin &&
    css`
      flex-direction: row;
      max-width: max-content;
      min-height: min-content;
    `}
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
const Header = styled.h2<{ thin?: boolean }>`
  font-weight: 600;
  font-size: 20px;
  margin: 0;
  padding-right: 30px;
  display: ${({ thin }) => (thin ? 'none' : 'block')};
`
const LinkOutCircle = styled(ArrowDownCircle)`
  margin-left: 12px;
  transform: rotate(230deg);
  width: 20px;
  height: 20px;
`
const LinkOutToBridge = styled(ExternalLink)<{ thin?: boolean }>`
  align-items: center;
  background-color: black;
  border-radius: 8px;
  color: white;
  display: flex;
  font-size: 16px;
  height: 44px;
  justify-content: space-between;
  margin: 0 12px 20px 18px;
  padding: 12px 16px;
  text-decoration: none;
  width: auto;
  :hover,
  :focus,
  :active {
    background-color: black;
  }
  ${({ thin }) =>
    thin &&
    css`
      font-size: 14px;
      margin: auto 10px;
      width: 168px;
    `}
`

interface NetworkAlertProps {
  thin?: boolean
}

const BETA_TAG_COLORS: { [chainId in SupportedL2ChainId]: string } = {
  [SupportedChainId.OPTIMISM]: '#ff0420',
  [SupportedChainId.OPTIMISTIC_KOVAN]: '#ff0420',
  [SupportedChainId.ARBITRUM_ONE]: '#0490ed',
  [SupportedChainId.ARBITRUM_RINKEBY]: '#0490ed',
}

export function NetworkAlert(props: NetworkAlertProps) {
  const { account, chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  const [alertAcknowledged, acknowledgeAlert] = useNetworkAlertStatus(chainId)
  const [locallyDismissed, setLocallyDimissed] = useState(alertAcknowledged)
  const accounts = useMemo(() => (account ? [account] : []), [account])
  const userNativeCurrencyBalance = useETHBalances(accounts)?.[account ?? '']

  const dismiss = useCallback(() => {
    setLocallyDimissed(true)
    if (!alertAcknowledged) acknowledgeAlert()
  }, [acknowledgeAlert, alertAcknowledged])

  if (!isL2ChainId(chainId) || locallyDismissed || alertAcknowledged || !chainId) {
    return null
  }

  const { label, logoUrl, bridge, helpCenterUrl } = CHAIN_INFO[chainId]
  const isOptimism = [SupportedChainId.OPTIMISM, SupportedChainId.OPTIMISTIC_KOVAN].includes(chainId)
  const depositUrl = isOptimism ? `${bridge}?chainId=1` : bridge
  const showCloseIcon = Boolean(userNativeCurrencyBalance?.greaterThan(0) && !props.thin)
  return (
    <RootWrapper>
      <BetaTag color={BETA_TAG_COLORS[chainId]}>Beta</BetaTag>
      <ContentWrapper chainId={chainId} darkMode={darkMode} logoUrl={logoUrl} thin={props.thin}>
        {showCloseIcon && <CloseIcon onClick={dismiss} />}
        <BodyText>
          <L2Icon src={logoUrl} />
          <Header thin={props.thin}>
            <Trans>Uniswap on {label}</Trans>
          </Header>
          <Body>
            <Trans>
              To start trading on {label}, first bridge your assets from L1 to L2. Please treat this as a beta release
              and learn about the risks before using {label}.
            </Trans>
          </Body>
        </BodyText>
        <Controls thin={props.thin}>
          <LinkOutToBridge href={depositUrl} thin={props.thin}>
            <Trans>Deposit Assets</Trans>
            <LinkOutCircle />
          </LinkOutToBridge>
          {helpCenterUrl ? (
            <LearnMoreLink href={helpCenterUrl} thin={props.thin}>
              <Trans>Learn More</Trans>
            </LearnMoreLink>
          ) : null}
        </Controls>
      </ContentWrapper>
    </RootWrapper>
  )
}
