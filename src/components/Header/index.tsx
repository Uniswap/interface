import { Trans, t } from '@lingui/macro'
import { darken } from 'polished'
import { CSSProperties, forwardRef, useState } from 'react'
import { Repeat } from 'react-feather'
import { NavLink as BaseNavLink, Link, NavLinkProps, useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

import { ReactComponent as MasterCard } from 'assets/buy-crypto/master-card.svg'
import { ReactComponent as Visa } from 'assets/buy-crypto/visa.svg'
import MultichainLogoDark from 'assets/images/multichain_black.png'
import MultichainLogoLight from 'assets/images/multichain_white.png'
import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import { ReactComponent as Dollar } from 'assets/svg/dollar.svg'
import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import SelectNetwork from 'components/Header/web3/SelectNetwork'
import SelectWallet from 'components/Header/web3/SelectWallet'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import Menu, { NewLabel } from 'components/Menu'
import Row, { RowFixed } from 'components/Row'
import Settings from 'components/Settings'
import { MouseoverTooltip } from 'components/Tooltip'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { AGGREGATOR_ANALYTICS_URL, APP_PATHS, PROMM_ANALYTICS_URL } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useIsDarkMode } from 'state/user/hooks'
import { ExternalLink } from 'theme/components'

interface Props extends NavLinkProps {
  activeClassName?: string
  activeStyle?: CSSProperties
}
// fix warning of activeClassName: https://reactrouter.com/en/6.4.5/upgrading/v5#remove-activeclassname-and-activestyle-props-from-navlink-
const NavLink = forwardRef(({ activeClassName, activeStyle, ...props }: Props, ref: any) => {
  return (
    <BaseNavLink
      ref={ref}
      {...props}
      className={({ isActive }) => [props.className, isActive ? activeClassName : null].filter(Boolean).join(' ')}
      style={({ isActive }) => ({
        ...props.style,
        ...(isActive ? activeStyle : null),
      })}
    />
  )
})

NavLink.displayName = 'NavLink'

const VisaSVG = styled(Visa)`
  path {
    fill: ${({ theme }) => theme.text};
  }
`

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
  z-index: 2;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    padding: 1rem;
    width: calc(100%);
    position: relative;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
   padding: 0.5rem 1rem;
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
`

const HeaderRow = styled(RowFixed)`
  ${({ theme }) => theme.mediaWidth.upToMedium`
   width: 100%;
  `};
`

const HeaderLinks = styled(Row)`
  justify-content: center;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    justify-content: flex-end;
  `};
`

const IconImage = styled.img`
  width: 140px;
  margin-top: 1px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 114px;
  `};

  @media only screen and (max-width: 400px) {
    width: 100px;
  }
`

const AnalyticsWrapper = styled.span`
  display: flex;
  align-items: center;
  @media (max-width: 1320px) {
    display: none;
  }
`

const DiscoverWrapper = styled.span`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const CampaignWrapper = styled.span``

const BlogWrapper = styled.span`
  @media (max-width: 1440px) {
    display: none;
  }
`

const AboutWrapper = styled.span`
  @media (max-width: 1400px) {
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

const UniIcon = styled.div`
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

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  padding: 8px 12px;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.subText};
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.primary};
  }

  :hover {
    color: ${({ theme }) => darken(0.1, theme.primary)};
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 8px 6px;
  `}
`

const StyledNavExternalLink = styled(ExternalLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.subText};
  font-size: 1rem;
  width: fit-content;
  padding: 8px 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.subText};
  }

  :hover {
    color: ${({ theme }) => darken(0.1, theme.primary)};
    text-decoration: none;
  }

  :focus {
    color: ${({ theme }) => theme.subText};
    text-decoration: none;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      display: none;
  `}
`

const shine = keyframes`
  0% {
    background-position: 0;
  }
  60% {
    background-position: 40px;
  }
  100% {
    background-position: 65px;
  }
`

export const SlideToUnlock = styled.div<{ active?: boolean }>`
  background: linear-gradient(
    to right,
    ${props => (props.active ? props.theme.primary : props.theme.subText)} 0,
    white 10%,
    ${props => (props.active ? props.theme.primary : props.theme.subText)} 20%
  );
  animation: ${shine} 1.3s infinite linear;
  animation-fill-mode: forwards;
  background-position: 0;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-text-size-adjust: none;
`

const Dropdown = styled.div`
  display: none;
  position: absolute;
  background: ${({ theme }) => theme.tableHeader};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.01), 0 4px 8px rgba(0, 0, 0, 0.04), 0 16px 24px rgba(0, 0, 0, 0.04),
    0 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 16px;
  padding: 8px;
  width: max-content;
  top: 32px;
`
const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
`
const cssDropDown = css`
  color: ${({ theme }) => darken(0.1, theme.primary)};

  ${Dropdown} {
    display: flex;
    flex-direction: column;

    ${StyledNavLink} {
      margin: 0;
    }
  }

  ${DropdownIcon} {
    transform: rotate(-180deg);
  }
`
const HoverDropdown = styled.div<{ active: boolean; forceShowDropdown?: boolean }>`
  position: relative;
  display: inline-block;
  cursor: pointer;

  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  font-size: 1rem;
  width: fit-content;
  padding: 8px 6px 8px 12px;
  font-weight: 500;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 8px 2px 8px 6px;
  `}
  ${({ forceShowDropdown }) => forceShowDropdown && cssDropDown}
  :hover {
    ${cssDropDown}
  }
`
const StyledBridgeIcon = styled(BridgeIcon)`
  path {
    fill: currentColor;
  }
`
export default function Header() {
  const { chainId, isEVM, isSolana, walletKey } = useActiveWeb3React()

  const upTo420 = useMedia('(max-width: 420px)')
  const isDark = useIsDarkMode()
  const { pathname } = useLocation()
  const [isHoverSlide, setIsHoverSlide] = useState(false)

  const [{ show: isShowTutorial = false, stepInfo }] = useTutorialSwapGuide()
  const { mixpanelHandler } = useMixpanel()
  return (
    <HeaderFrame>
      <HeaderRow>
        <Title to="/swap">
          <UniIcon>
            <IconImage src={isDark ? '/logo-dark.svg' : '/logo.svg'} alt="logo" />
          </UniIcon>
        </Title>
        <HeaderLinks>
          <HoverDropdown
            forceShowDropdown={isShowTutorial && stepInfo?.selector === `#${TutorialIds.BRIDGE_LINKS}`}
            active={pathname.includes(APP_PATHS.SWAP) || [APP_PATHS.BUY_CRYPTO, APP_PATHS.BRIDGE].includes(pathname)}
          >
            <Flex alignItems="center">
              <Trans>Swap</Trans>
              <DropdownIcon />
            </Flex>

            <Dropdown>
              <StyledNavLink id={`swapv2-nav-link`} to={APP_PATHS.SWAP} style={{ flexDirection: 'column' }}>
                <Flex alignItems="center" sx={{ gap: '13px' }}>
                  <Repeat size={16} />
                  <Trans>Swap</Trans>
                </Flex>
              </StyledNavLink>
              <div id={TutorialIds.BRIDGE_LINKS}>
                <StyledNavLink
                  id={`buy-crypto-nav-link`}
                  to={APP_PATHS.BUY_CRYPTO}
                  onClick={() => {
                    mixpanelHandler(MIXPANEL_TYPE.SWAP_BUY_CRYPTO_CLICKED)
                  }}
                >
                  <Flex alignItems="center" sx={{ gap: '8px' }}>
                    <Flex sx={{ gap: '10px' }}>
                      <Dollar style={{ marginLeft: -1 }} />
                      <Trans>Buy Crypto</Trans>
                    </Flex>
                    <Flex sx={{ gap: '8px' }}>
                      <VisaSVG width="20" height="20" />
                      <MasterCard width="20" height="20" />
                    </Flex>
                  </Flex>
                </StyledNavLink>
                {isSolana || (
                  <StyledNavLink to={APP_PATHS.BRIDGE} style={{ flexDirection: 'column', width: '100%' }}>
                    <Flex alignItems="center" sx={{ gap: '10px' }} justifyContent="space-between">
                      <StyledBridgeIcon height={15} />
                      <Flex alignItems={'center'} style={{ flex: 1 }} justifyContent={'space-between'}>
                        <Text>
                          <Trans>Bridge</Trans>
                        </Text>
                        <img
                          src={isDark ? MultichainLogoLight : MultichainLogoDark}
                          alt="kyberswap with multichain"
                          height={10}
                        />
                      </Flex>
                    </Flex>
                  </StyledNavLink>
                )}
              </div>
            </Dropdown>
          </HoverDropdown>

          {isEVM && (
            <Flex id={TutorialIds.EARNING_LINKS} alignItems="center">
              <HoverDropdown
                active={pathname.toLowerCase().includes('pools') || pathname.toLowerCase().startsWith('/farms')}
              >
                <Flex alignItems="center">
                  <Trans>Earn</Trans>
                  <DropdownIcon />
                </Flex>
                <Dropdown>
                  <StyledNavLink id="pools-nav-link" to={APP_PATHS.POOLS} style={{ width: '100%' }}>
                    <Trans>Pools</Trans>
                  </StyledNavLink>

                  <StyledNavLink id="my-pools-nav-link" to={APP_PATHS.MY_POOLS}>
                    <Trans>My Pools</Trans>
                  </StyledNavLink>

                  <StyledNavLink
                    onClick={() => {
                      mixpanelHandler(MIXPANEL_TYPE.FARM_UNDER_EARN_TAB_CLICK)
                    }}
                    id="farms-nav-link"
                    to="/farms"
                  >
                    <Trans>Farms</Trans>
                    <NewLabel>
                      <Trans>New</Trans>
                    </NewLabel>
                  </StyledNavLink>
                </Dropdown>
              </HoverDropdown>
            </Flex>
          )}

          {!upTo420 && (
            <CampaignWrapper id={TutorialIds.CAMPAIGN_LINK}>
              <HoverDropdown
                active={
                  pathname.toLowerCase().includes(APP_PATHS.CAMPAIGN) ||
                  pathname.toLowerCase().includes(APP_PATHS.GRANT_PROGRAMS)
                }
              >
                <Flex alignItems="center">
                  <Trans>Campaigns</Trans>
                  <DropdownIcon />
                </Flex>
                <Dropdown>
                  <StyledNavLink id="campaigns" to={APP_PATHS.CAMPAIGN}>
                    <Trans>Trading Campaigns</Trans>
                  </StyledNavLink>

                  {/* <StyledNavLink id="grant_programs" to={APP_PATHS.GRANT_PROGRAMS}>
                    <Trans>Inter-Project Trading</Trans>
                  </StyledNavLink> */}
                </Dropdown>
              </HoverDropdown>
            </CampaignWrapper>
          )}

          <DiscoverWrapper id={TutorialIds.DISCOVER_LINK}>
            <StyledNavLink to={'/discover?tab=trending_soon'} style={{ alignItems: 'center' }}>
              <SlideToUnlock
                active={pathname.includes('discover') || isHoverSlide}
                onMouseEnter={() => setIsHoverSlide(true)}
                onMouseLeave={() => setIsHoverSlide(false)}
              >
                <Trans>Discover</Trans>
              </SlideToUnlock>
              <DiscoverIcon size={14} style={{ marginTop: '-20px', marginLeft: '4px' }} />
            </StyledNavLink>
          </DiscoverWrapper>

          <AnalyticsWrapper>
            <HoverDropdown active={false}>
              <Flex alignItems="center">
                <Trans>Analytics</Trans>
                <DropdownIcon />
              </Flex>
              <Dropdown>
                <StyledNavExternalLink
                  onClick={() => {
                    mixpanelHandler(MIXPANEL_TYPE.ANALYTICS_MENU_CLICKED)
                  }}
                  target="_blank"
                  href={PROMM_ANALYTICS_URL[chainId] + '/home'}
                >
                  <Trans>Liquidity</Trans>
                </StyledNavExternalLink>

                <StyledNavExternalLink target="_blank" href={AGGREGATOR_ANALYTICS_URL}>
                  <Trans>Aggregator</Trans>
                </StyledNavExternalLink>
              </Dropdown>
            </HoverDropdown>
          </AnalyticsWrapper>

          <AboutWrapper>
            <HoverDropdown active={pathname.toLowerCase().includes('about')}>
              <Flex alignItems="center">
                <Trans>About</Trans>
                <DropdownIcon />
              </Flex>
              <Dropdown>
                <StyledNavLink id={`about-kyberswap`} to={'/about/kyberswap'}>
                  <Trans>KyberSwap</Trans>
                </StyledNavLink>

                <StyledNavLink id={`about-knc`} to={'/about/knc'}>
                  <Trans> KNC</Trans>
                </StyledNavLink>
              </Dropdown>
            </HoverDropdown>
          </AboutWrapper>

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
          <Settings />
          <Menu />
        </HeaderElementWrap>
      </HeaderControls>
    </HeaderFrame>
  )
}
