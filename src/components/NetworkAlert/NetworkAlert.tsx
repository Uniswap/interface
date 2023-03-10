import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { ArrowUpRight } from 'react-feather'
import { useDarkModeManager } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, HideSmall } from 'theme'

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
  [SupportedChainId.FUJI]: false,
  [SupportedChainId.TESTNET]: false,
}

type NetworkAlertChains = keyof typeof SHOULD_SHOW_ALERT

const BG_COLORS_BY_DARK_MODE_AND_CHAIN_ID: {
  [darkMode in 'dark' | 'light']: { [chainId in NetworkAlertChains]: string }
} = {
  dark: {
    [SupportedChainId.FUJI]:
      'radial-gradient(100% 93.36% at 0% 6.64%, rgba(160, 108, 247, 0.1) 0%, rgba(82, 32, 166, 0.1) 100%)',
    [SupportedChainId.TESTNET]:
      'radial-gradient(100% 93.36% at 0% 6.64%, rgba(160, 108, 247, 0.1) 0%, rgba(82, 32, 166, 0.1) 100%)',
  },
  light: {
    [SupportedChainId.TESTNET]:
      'radial-gradient(182.71% 205.59% at 2.81% 7.69%, rgba(130, 71, 229, 0.2) 0%, rgba(167, 202, 255, 0.2) 100%)',
    [SupportedChainId.FUJI]:
      'radial-gradient(182.71% 205.59% at 2.81% 7.69%, rgba(130, 71, 229, 0.2) 0%, rgba(167, 202, 255, 0.2) 100%)',
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
  [SupportedChainId.FUJI]: 'rgba(130, 71, 229)',
  [SupportedChainId.TESTNET]: 'rgba(130, 71, 229)',
}

function shouldShowAlert(chainId: number | undefined): chainId is NetworkAlertChains {
  return Boolean(chainId && SHOULD_SHOW_ALERT[chainId as unknown as NetworkAlertChains])
}

export function NetworkAlert() {
  const { chainId } = useWeb3React()
  const [darkMode] = useDarkModeManager()

  if (!shouldShowAlert(chainId)) {
    return null
  }

  const chainInfo = getChainInfo(chainId)
  if (!chainInfo) return null

  const { label, logoUrl, bridge } = chainInfo
  const textColor = TEXT_COLORS[chainId]

  return bridge ? (
    <RootWrapper>
      <ContentWrapper chainId={chainId} darkMode={darkMode} logoUrl={logoUrl}>
        <LinkOutToBridge href={bridge}>
          <BodyText color={textColor}>
            <L2Icon src={logoUrl} />
            <AutoRow>
              <Header>
                <Trans>{label} token bridge</Trans>
              </Header>
              <HideSmall>
                <Trans>Deposit tokens to the {label} network.</Trans>
              </HideSmall>
            </AutoRow>
          </BodyText>
          <StyledArrowUpRight color={textColor} />
        </LinkOutToBridge>
      </ContentWrapper>
    </RootWrapper>
  ) : null
}
