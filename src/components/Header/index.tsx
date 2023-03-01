import { Trans, t } from '@lingui/macro'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Announcement from 'components/Announcement'
import SelectNetwork from 'components/Header/web3/SelectNetwork'
import SelectWallet from 'components/Header/web3/SelectWallet'
import Menu from 'components/Menu'
import Row, { RowFixed } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useHolidayMode, useIsDarkMode } from 'state/user/hooks'

import DiscoverNavItem from './DiscoverNavItem'
import AboutNavGroup from './groups/AboutNavGroup'
import AnalyticNavGroup from './groups/AnalyticNavGroup'
import EarnNavGroup from './groups/EarnNavGroup'
import KyberDAONavGroup from './groups/KyberDaoGroup'
import SwapNavGroup from './groups/SwapNavGroup'
import { StyledNavExternalLink, StyledNavLink } from './styleds'

const HeaderFrame = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  background-color: ${({ theme }) => theme.background};
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem;
  z-index: ${Z_INDEXS.HEADER};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    padding: 1rem;
    width: calc(100%);
    position: relative;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
   padding: 0.5rem 1rem;
   height: 60px;
  `}
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: row;
    justify-content: space-between;
    justify-self: center;
    width: 100%;
    padding: 1rem;
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 100%;
    z-index: 98;
    height: 72px;
    border-radius: 12px 12px 0 0;
    background-color: ${({ theme }) => theme.background};
  `};
  ${({ theme }) => theme.mediaWidth.upToSmall`
      height: 60px;
  `};
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: center;
  `};
`

const HeaderElementWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const HeaderRow = styled(RowFixed)`
  ${({ theme }) => theme.mediaWidth.upToMedium`
   width: 100%;
  `};
`

const HeaderLinks = styled(Row)`
  gap: 4px;
  justify-content: center;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    justify-content: flex-end;
  `};
`

const IconImage = styled.img<{ isChristmas?: boolean }>`
  width: 140px;
  margin-top: ${({ isChristmas }) => (isChristmas ? '-18px' : '1px')};

  ${({ theme, isChristmas }) => theme.mediaWidth.upToSmall`
    width: 114px;
    margin-top: ${isChristmas ? '-10px' : '1px'};
  `};

  @media only screen and (max-width: 400px) {
    width: 100px;
  }
`

const CampaignWrapper = styled.span`
  /* It's better to break at 420px than at extraSmall */
  @media (max-width: 420px) {
    display: none;
  }
`

const BlogWrapper = styled.span`
  @media (max-width: 1440px) {
    display: none;
  }
`

const Title = styled(Link)`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-right: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};
  :hover {
    cursor: pointer;
  }
`

const LogoIcon = styled.div`
  transition: transform 0.3s ease;

  :hover {
    transform: rotate(-5deg);
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    :hover {
      transform: rotate(0);
    }
  `}
`

export default function Header() {
  const { walletKey, networkInfo } = useActiveWeb3React()
  const isDark = useIsDarkMode()
  const [holidayMode] = useHolidayMode()

  const { mixpanelHandler } = useMixpanel()
  return (
    <HeaderFrame>
      <HeaderRow>
        <Title to={`${APP_PATHS.SWAP}/${networkInfo.route}`}>
          {holidayMode ? (
            <LogoIcon>
              <IconImage
                isChristmas
                src={isDark ? '/christmas-logo-dark.svg' : '/christmas-logo-light.svg'}
                alt="logo"
              />
            </LogoIcon>
          ) : (
            <LogoIcon>
              <IconImage src={isDark ? '/logo-dark.svg' : '/logo.svg'} alt="logo" />
            </LogoIcon>
          )}
        </Title>
        <HeaderLinks>
          <SwapNavGroup />

          <EarnNavGroup />

          <CampaignWrapper id={TutorialIds.CAMPAIGN_LINK}>
            <StyledNavLink id="campaigns" to={APP_PATHS.CAMPAIGN}>
              <Trans>Campaigns</Trans>
            </StyledNavLink>
          </CampaignWrapper>

          <DiscoverNavItem />
          <KyberDAONavGroup />

          <AnalyticNavGroup />
          <AboutNavGroup />
          <BlogWrapper>
            <StyledNavExternalLink
              onClick={() => {
                mixpanelHandler(MIXPANEL_TYPE.BLOG_MENU_CLICKED)
              }}
              target="_blank"
              href="https://blog.kyberswap.com"
            >
              <Trans>Blog</Trans>
            </StyledNavExternalLink>
          </BlogWrapper>
        </HeaderLinks>
      </HeaderRow>
      <HeaderControls>
        <HeaderElement>
          <MouseoverTooltip
            text={t`You are currently connected through WalletConnect. If you want to change the connected network, please disconnect your wallet before changing the network.`}
            disableTooltip={walletKey !== 'WALLET_CONNECT'}
          >
            <SelectNetwork disabled={walletKey === 'WALLET_CONNECT'} />
          </MouseoverTooltip>
          <SelectWallet />
        </HeaderElement>
        <HeaderElementWrap>
          <Announcement />
          <Menu />
        </HeaderElementWrap>
      </HeaderControls>
    </HeaderFrame>
  )
}
