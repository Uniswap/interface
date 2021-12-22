import { Trans } from '@lingui/macro'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useMemo, useState } from 'react'
import { ArrowDownCircle, X } from 'react-feather'
import { useDarkModeManager, useNetworkAlertStatus } from 'state/user/hooks'
import { useNativeCurrencyBalances } from 'state/wallet/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

import { CHAIN_INFO } from '../../constants/chains'
import { ThemedText } from '../../theme'
import { AutoRow } from '../Row'

const L2Icon = styled.img`
  width: 36px;
  height: 36px;
  justify-self: center;
  margin-right: 14px;
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
export const Controls = styled.div`
  align-items: center;
  display: flex;
  justify-content: flex-start;
  padding: 0 20px 20px 20px;
`
const CloseIcon = styled(X)`
  cursor: pointer;
  position: absolute;
  top: 16px;
  right: 16px;
`
const BodyText = styled.div`
  align-items: center;
  margin: 20px 16px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    grid-template-columns: 42px 4fr;
    grid-gap: 8px;
  }
`
const LearnMoreLink = styled(ExternalLink)`
  align-items: center;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  color: ${({ theme }) => theme.text1};
  display: flex;
  font-size: 16px;
  height: 44px;
  justify-content: space-between;
  padding: 12px 16px;
  text-decoration: none;
  width: auto;
  :hover,
  :focus,
  :active {
    background-color: rgba(255, 255, 255, 0.05);
  }
  transition: background-color 150ms ease-in-out;
`
const RootWrapper = styled.div`
  position: relative;
`
const BG_COLORS_BY_DARK_MODE_AND_CHAIN_ID: {
  [darkMode in 'dark' | 'light']: { [chainId in SupportedChainId]?: string }
} = {
  dark: {
    [SupportedChainId.POLYGON]:
      'radial-gradient(100% 93.36% at 0% 6.64%, rgba(160, 108, 247, 0.3) 0%, rgba(82, 32, 166, 0.3) 100%)',
    [SupportedChainId.POLYGON_MUMBAI]:
      'radial-gradient(100% 93.36% at 0% 6.64%, rgba(160, 108, 247, 0.3) 0%, rgba(82, 32, 166, 0.3) 100%)',
    [SupportedChainId.OPTIMISM]:
      'radial-gradient(948% 292% at 42% 0%, rgba(255, 58, 212, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%),radial-gradient(98% 96% at 2% 0%, rgba(255, 39, 39, 0.5) 0%, rgba(235, 0, 255, 0.345) 96%)',
    [SupportedChainId.OPTIMISTIC_KOVAN]:
      'radial-gradient(948% 292% at 42% 0%, rgba(255, 58, 212, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%),radial-gradient(98% 96% at 2% 0%, rgba(255, 39, 39, 0.5) 0%, rgba(235, 0, 255, 0.345) 96%)',
    [SupportedChainId.ARBITRUM_ONE]:
      'radial-gradient(285% 8200% at 30% 50%, rgba(40, 160, 240, 0.1) 0%, rgba(219, 255, 0, 0) 100%),radial-gradient(75% 75% at 0% 0%, rgba(150, 190, 220, 0.3) 0%, rgba(33, 114, 229, 0.3) 100%), hsla(0, 0%, 100%, 0.1)',
    [SupportedChainId.ARBITRUM_RINKEBY]:
      'radial-gradient(285% 8200% at 30% 50%, rgba(40, 160, 240, 0.1) 0%, rgba(219, 255, 0, 0) 100%),radial-gradient(75% 75% at 0% 0%, rgba(150, 190, 220, 0.3) 0%, rgba(33, 114, 229, 0.3) 100%), hsla(0, 0%, 100%, 0.1)',
  },
  light: {
    [SupportedChainId.POLYGON]:
      'radial-gradient(182.71% 205.59% at 2.81% 7.69%, rgba(130, 71, 229, 0.3) 0%, rgba(167, 202, 255, 0.3) 100%)',
    [SupportedChainId.POLYGON_MUMBAI]:
      'radial-gradient(182.71% 205.59% at 2.81% 7.69%, rgba(130, 71, 229, 0.3) 0%, rgba(167, 202, 255, 0.3) 100%)',
    [SupportedChainId.OPTIMISM]:
      'radial-gradient(92% 105% at 50% 7%, rgba(255, 58, 212, 0.04) 0%, rgba(255, 255, 255, 0.03) 100%),radial-gradient(100% 97% at 0% 12%, rgba(235, 0, 255, 0.1) 0%, rgba(243, 19, 19, 0.1) 100%), hsla(0, 0%, 100%, 0.5)',
    [SupportedChainId.OPTIMISTIC_KOVAN]:
      'radial-gradient(92% 105% at 50% 7%, rgba(255, 58, 212, 0.04) 0%, rgba(255, 255, 255, 0.03) 100%),radial-gradient(100% 97% at 0% 12%, rgba(235, 0, 255, 0.1) 0%, rgba(243, 19, 19, 0.1) 100%), hsla(0, 0%, 100%, 0.5)',
    [SupportedChainId.ARBITRUM_ONE]:
      'radial-gradient(285% 8200% at 30% 50%, rgba(40, 160, 240, 0.1) 0%, rgba(219, 255, 0, 0) 100%),radial-gradient(circle at top left, hsla(206, 50%, 75%, 0.01), hsla(215, 79%, 51%, 0.12)), hsla(0, 0%, 100%, 0.1)',
    [SupportedChainId.ARBITRUM_RINKEBY]:
      'radial-gradient(285% 8200% at 30% 50%, rgba(40, 160, 240, 0.1) 0%, rgba(219, 255, 0, 0) 100%),radial-gradient(circle at top left, hsla(206, 50%, 75%, 0.01), hsla(215, 79%, 51%, 0.12)), hsla(0, 0%, 100%, 0.1)',
  },
}

const ContentWrapper = styled.div<{ chainId: SupportedChainId; darkMode: boolean; logoUrl: string }>`
  background: ${({ chainId, darkMode }) => BG_COLORS_BY_DARK_MODE_AND_CHAIN_ID[darkMode ? 'dark' : 'light'][chainId]};
  border-radius: 20px;
  display: flex;
  flex-direction: column;
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
const LinkOutCircle = styled(ArrowDownCircle)`
  margin-left: 12px;
  transform: rotate(230deg);
  width: 20px;
  height: 20px;
`
const LinkOutToBridge = styled(ExternalLink)`
  align-items: center;
  background-color: black;
  border-radius: 8px;
  color: white;
  display: flex;
  font-size: 16px;
  height: 44px;
  justify-content: space-between;
  padding: 12px 16px;
  margin-right: 20px;
  text-decoration: none;
  width: auto;
  :hover,
  :focus,
  :active {
    background-color: black;
  }
`

const DisclaimerText = styled(ThemedText.Body)`
  padding: 0 0.5em;
  font-size: 14px !important;
`

const BETA_TAG_COLORS: { [chainId in SupportedChainId]?: string } = {
  [SupportedChainId.OPTIMISM]: '#ff0420',
  [SupportedChainId.OPTIMISTIC_KOVAN]: '#ff0420',
  [SupportedChainId.ARBITRUM_ONE]: '#0490ed',
  [SupportedChainId.ARBITRUM_RINKEBY]: '#0490ed',
}

const SHOULD_SHOW_ALERT: { [chainId in SupportedChainId]?: true } = {
  [SupportedChainId.OPTIMISM]: true,
  [SupportedChainId.OPTIMISTIC_KOVAN]: true,
  [SupportedChainId.ARBITRUM_ONE]: true,
  [SupportedChainId.ARBITRUM_RINKEBY]: true,
  [SupportedChainId.POLYGON]: true,
  [SupportedChainId.POLYGON_MUMBAI]: true,
}

function shouldShowAlert(chainId: number | undefined): chainId is SupportedChainId {
  return Boolean(chainId && SHOULD_SHOW_ALERT[chainId as SupportedChainId])
}

export function NetworkAlert() {
  const { account, chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  const [alertAcknowledged, acknowledgeAlert] = useNetworkAlertStatus(chainId)
  const [locallyDismissed, setLocallyDimissed] = useState(false)
  const accounts = useMemo(() => (account ? [account] : []), [account])
  const userNativeCurrencyBalance = useNativeCurrencyBalances(accounts)?.[account ?? '']

  const dismiss = useCallback(() => {
    setLocallyDimissed(true)
    if (!alertAcknowledged) acknowledgeAlert()
  }, [acknowledgeAlert, alertAcknowledged])

  if (!shouldShowAlert(chainId) || alertAcknowledged || locallyDismissed) {
    return null
  }

  const { label, logoUrl, bridge, helpCenterUrl } = CHAIN_INFO[chainId]
  const showCloseIcon = Boolean(userNativeCurrencyBalance?.greaterThan(0))
  const betaColor = BETA_TAG_COLORS[chainId]
  return (
    <RootWrapper>
      {betaColor ? <BetaTag color={betaColor}>Beta</BetaTag> : null}
      <ContentWrapper chainId={chainId} darkMode={darkMode} logoUrl={logoUrl}>
        {showCloseIcon && <CloseIcon onClick={dismiss} />}
        <BodyText>
          <AutoRow style={{ marginBottom: '1em' }}>
            <L2Icon src={logoUrl} />
            <Header>
              <Trans>Uniswap on {label}</Trans>
            </Header>
          </AutoRow>
          <DisclaimerText>
            {betaColor ? (
              <Trans>
                Please treat this as a beta release and learn about the risks before using {label}. To start trading on{' '}
                {label}, first bridge your assets from L1 to L2.
              </Trans>
            ) : (
              <Trans>To start trading on {label}, first bridge your assets from L1 to L2.</Trans>
            )}
          </DisclaimerText>
        </BodyText>
        <Controls>
          {bridge ? (
            <LinkOutToBridge href={bridge}>
              <Trans>Deposit Assets</Trans>
              <LinkOutCircle />
            </LinkOutToBridge>
          ) : null}
          {helpCenterUrl ? (
            <LearnMoreLink href={helpCenterUrl}>
              <Trans>Learn More</Trans>
            </LearnMoreLink>
          ) : null}
        </Controls>
      </ContentWrapper>
    </RootWrapper>
  )
}

const AlertRow = styled.div`
  display: flex;
  padding: 1em;
  align-items: center;
`
const ButtonContainer = styled.div`
  flex-shrink: 0;
  flex-grow: 0;
  display: flex;
  height: 100%;
`
const FlexGrow = styled.div`
  flex-grow: 1;
`
export function SingleRowNetworkAlert() {
  const { chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()

  if (!shouldShowAlert(chainId)) {
    return null
  }

  const { label, logoUrl, bridge, helpCenterUrl } = CHAIN_INFO[chainId]
  const betaColor = BETA_TAG_COLORS[chainId]

  return (
    <RootWrapper>
      {betaColor ? <BetaTag color={betaColor}>Beta</BetaTag> : null}
      <ContentWrapper chainId={chainId} darkMode={darkMode} logoUrl={logoUrl}>
        <AlertRow>
          <L2Icon src={logoUrl} />

          <FlexGrow>
            <DisclaimerText>
              {betaColor ? (
                <Trans>
                  Please treat this as a beta release and learn about the risks before using {label}. To start trading
                  on {label}, first bridge your assets from L1 to L2.
                </Trans>
              ) : (
                <Trans>To start trading on {label}, first bridge your assets from L1 to L2.</Trans>
              )}
            </DisclaimerText>
          </FlexGrow>

          <ButtonContainer>
            {bridge ? (
              <LinkOutToBridge href={bridge}>
                <Trans>Deposit Assets</Trans>
                <LinkOutCircle />
              </LinkOutToBridge>
            ) : null}
            {helpCenterUrl ? (
              <LearnMoreLink href={helpCenterUrl}>
                <Trans>Learn More</Trans>
              </LearnMoreLink>
            ) : null}
          </ButtonContainer>
        </AlertRow>
      </ContentWrapper>
    </RootWrapper>
  )
}
