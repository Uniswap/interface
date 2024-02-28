import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { ArrowUpRight } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink, HideSmall } from 'theme'
import { useDarkModeManager } from 'theme/components/ThemeToggle'

import { AutoRow } from '../Row'

const L2Icon = styled.img`
  width: 24px;
  height: 24px;
  margin-right: 16px;
`

const BodyText = styled.div`
  color: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 8px;
  font-size: 14px;
`
const RootWrapper = styled.div`
  margin-top: 16px;
`

const SHOULD_SHOW_ALERT = {
  [SupportedChainId.ROLLUX]: true,
  [SupportedChainId.ROLLUX_TANENBAUM]: true,
}

type NetworkAlertChains = keyof typeof SHOULD_SHOW_ALERT

const BG_COLORS_BY_DARK_MODE_AND_CHAIN_ID: {
  [darkMode in 'dark' | 'light']: { [chainId in NetworkAlertChains]: string }
} = {
  dark: {
    [SupportedChainId.ROLLUX]:
      'radial-gradient(182.71% 150.59% at 2.81% 7.69%, rgba(240, 185, 11, 0.16) 0%, rgba(255, 168, 0, 0.16) 100%)',
    [SupportedChainId.ROLLUX_TANENBAUM]:
      'radial-gradient(182.71% 150.59% at 2.81% 7.69%, rgba(240, 185, 11, 0.16) 0%, rgba(255, 168, 0, 0.16) 100%)',
  },
  light: {
    [SupportedChainId.ROLLUX]:
      'radial-gradient(182.71% 150.59% at 2.81% 7.69%, rgba(240, 185, 11, 0.16) 0%, rgba(255, 168, 0, 0.16) 100%)',
    [SupportedChainId.ROLLUX_TANENBAUM]:
      'radial-gradient(182.71% 150.59% at 2.81% 7.69%, rgba(240, 185, 11, 0.16) 0%, rgba(255, 168, 0, 0.16) 100%)',
  },
}

const ContentWrapper = styled.div<{ chainId: NetworkAlertChains; darkMode: boolean; logoUrl: string }>`
  background: ${({ chainId, darkMode }) => BG_COLORS_BY_DARK_MODE_AND_CHAIN_ID[darkMode ? 'dark' : 'light'][chainId]};
  border-radius: 20px;
  display: flex;
  flex-direction: row;
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
  }
`
const Header = styled.h2`
  font-weight: 600;
  font-size: 16px;
  margin: 0;
`

const LinkOutToBridge = styled(ExternalLink)`
  align-items: center;
  border-radius: 8px;
  color: white;
  display: flex;
  font-size: 16px;
  justify-content: space-between;
  padding: 6px 8px;
  margin-right: 12px;
  text-decoration: none !important;
  width: 100%;
`

const StyledArrowUpRight = styled(ArrowUpRight)`
  margin-left: 12px;
  width: 24px;
  height: 24px;
`

const TEXT_COLORS: { [chainId in NetworkAlertChains]: string } = {
  [SupportedChainId.ROLLUX]: 'rgb(255 130 0)',
  [SupportedChainId.ROLLUX_TANENBAUM]: 'rgb(255 130 0)',
}

function shouldShowAlert(chainId: number | undefined): chainId is NetworkAlertChains {
  return Boolean(chainId && SHOULD_SHOW_ALERT[chainId as NetworkAlertChains])
}

export function BannerAlert() {
  const { chainId } = useWeb3React()
  const [darkMode] = useDarkModeManager()
  const { black } = useTheme()
  if (!shouldShowAlert(chainId)) {
    return null
  }

  const isRolluxChain = SupportedChainId.ROLLUX || SupportedChainId.ROLLUX_TANENBAUM
  const chainInfo = getChainInfo(chainId)
  if (!chainInfo) return null

  const textColor = TEXT_COLORS[chainId]

  return (
    <RootWrapper>
      <ContentWrapper
        chainId={chainId}
        darkMode={darkMode}
        logoUrl="https://images.squarespace-cdn.com/content/v1/638a48377c09bb00bbc62b94/019e9ada-f799-47ec-b429-c4b6c5f426ec/coinify_logomark_orange.png?format=1500w"
      >
        <LinkOutToBridge href="https://trade.coinify.com/syscoin?cryptoCurrencies=SYSROLLUX,SYSEVM,SYS&defaultCryptoCurrency=SYSROLLUX&targetPage=buy">
          <BodyText color={isRolluxChain ? (darkMode ? textColor : black) : textColor}>
            <L2Icon src="https://images.squarespace-cdn.com/content/v1/638a48377c09bb00bbc62b94/019e9ada-f799-47ec-b429-c4b6c5f426ec/coinify_logomark_orange.png?format=1500w" />
            <AutoRow>
              <Header>
                <Trans>Buy $SYS on Coinify</Trans>
              </Header>
              <HideSmall>
                <Trans>With a few clicks you can acquire $SYS on Rollux Network</Trans>
              </HideSmall>
            </AutoRow>
          </BodyText>
          <StyledArrowUpRight color={isRolluxChain ? (darkMode ? textColor : black) : textColor} />
        </LinkOutToBridge>
      </ContentWrapper>
    </RootWrapper>
  )
}
