import { ChainId } from '@kyberswap/ks-sdk-core'
import React, { useState } from 'react'
import { Text, Flex } from 'rebass'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { darken } from 'polished'
import { Trans } from '@lingui/macro'
import styled, { keyframes } from 'styled-components'

import { PROMM_ANALYTICS_URL } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useETHBalances } from 'state/wallet/hooks'
import Settings from 'components/Settings'
import Menu from 'components/Menu'
import Row, { RowFixed } from '../Row'
import Web3Status from '../Web3Status'
import { ExternalLink } from 'theme/components'
import Web3Network from 'components/Web3Network'
import { useIsDarkMode } from 'state/user/hooks'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import { useWindowSize } from 'hooks/useWindowSize'
import AboutPageDropwdown from 'components/AboutPageDropDown'
// import { MouseoverTooltip } from 'components/Tooltip'

const HeaderFrame = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  background-color: ${({ theme }) => theme.bg6};
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
    background-color: ${({ theme }) => theme.bg1};
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
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg3)};
  border-radius: 999px;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;

  :focus {
    border: 1px solid blue;
  }
`

const AnalyticsWrapper = styled.span`
  @media (max-width: 576px) {
    display: none;
  }
`

const DiscoverWrapper = styled.span`
  @media (max-width: 576px) {
    display: none;
  }
`

const AboutWrapper = styled.span`
  @media (max-width: 1320px) {
    display: none;
  }
`

const BalanceText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
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

const YieldMenuWrapper = styled.div`
  position: relative;
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
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 8px;
  padding: 8px 4px;
  width: max-content;
  top: 32px;

  left: 50%;
  transform: translate(-50%, 0);
`
const DropdownIcon = styled.div`
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid ${({ theme }) => theme.subText};
  margin-left: 4px;

  transition: transform 300ms;
`

const HoverDropdown = styled.div<{ active: boolean }>`
  position: relative;
  display: inline-block;
  cursor: pointer;

  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  font-size: 1rem;
  width: fit-content;
  padding: 8px 12px;
  font-weight: 500;

  ${DropdownIcon} {
    border-top: 6px solid ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  }

  :hover {
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
      border-top: 6px solid ${({ theme }) => theme.primary};
    }
  }
`

export default function Header() {
  const { account, chainId } = useActiveWeb3React()
  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']

  const isDark = useIsDarkMode()
  const { pathname } = useLocation()
  const [isHoverSlide, setIsHoverSlide] = useState(false)

  const { width } = useWindowSize()

  const under369 = width && width < 369

  return (
    <HeaderFrame>
      <HeaderRow>
        <Title to="/swap">
          <UniIcon>
            <IconImage src={isDark ? '/logo-dark.svg' : '/logo.svg'} alt="logo" />
          </UniIcon>
        </Title>
        <HeaderLinks>
          <StyledNavLink
            id={`swapv2-nav-link`}
            to={'/swap'}
            isActive={match => Boolean(match)}
            style={{ flexDirection: 'column' }}
          >
            <Trans>Swap</Trans>
          </StyledNavLink>

          <HoverDropdown active={pathname.toLowerCase().includes('pools')}>
            <Flex alignItems="center">
              <Trans>Earn</Trans>
              <DropdownIcon />
            </Flex>
            <Dropdown>
              <StyledNavLink
                id={`pools-nav-link`}
                to="/pools"
                isActive={(match, { pathname }) => Boolean(match) || pathname.startsWith('/pools')}
                style={{ width: '100%' }}
              >
                <Trans>Pools</Trans>
              </StyledNavLink>

              <StyledNavLink
                id={`my-pools-nav-link`}
                to={'/myPools'}
                isActive={(match, { pathname }) =>
                  Boolean(match) ||
                  pathname.startsWith('/add') ||
                  pathname.startsWith('/remove') ||
                  pathname.startsWith('/create') ||
                  (pathname.startsWith('/find') && pathname.endsWith('find'))
                }
              >
                <Trans>My Pools</Trans>
              </StyledNavLink>
            </Dropdown>
          </HoverDropdown>

          {!under369 && (
            <StyledNavLink id={`farms-nav-link`} to={'/farms'} isActive={match => Boolean(match)}>
              <YieldMenuWrapper>
                <Trans>Farm</Trans>
              </YieldMenuWrapper>
            </StyledNavLink>
          )}

          <DiscoverWrapper>
            <StyledNavLink
              to={'/discover?tab=trending_soon'}
              isActive={match => Boolean(match)}
              style={{ alignItems: 'center' }}
            >
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
            <StyledNavExternalLink href={PROMM_ANALYTICS_URL[chainId as ChainId] + '/home'}>
              <Trans>Analytics</Trans>
            </StyledNavExternalLink>
          </AnalyticsWrapper>

          <AboutWrapper>
            <AboutPageDropwdown />
          </AboutWrapper>
        </HeaderLinks>
      </HeaderRow>
      <HeaderControls>
        <HeaderElement>
          {/*  <HideExtraSmall>
            <MouseoverTooltip text={t`Test our L2 solution now!`} placement="bottom">
              <SlideToUnlock>
                <StyledNavExternalLink href={process.env.REACT_APP_ZKYBER_URL || ''}>
                  <Text width="max-content">ZKyber ↗</Text>
                </StyledNavExternalLink>
              </SlideToUnlock>
            </MouseoverTooltip>
          </HideExtraSmall>
          */}

          <Web3Network />

          <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
            {account && userEthBalance ? (
              <BalanceText style={{ flexShrink: 0 }} pl="0.75rem" pr="0.5rem" fontWeight={500}>
                {userEthBalance?.toSignificant(4)}{' '}
                {chainId && [1, 3, 4, 5, 42].includes(chainId)
                  ? `ETH`
                  : chainId && [137, 80001].includes(chainId)
                  ? `MATIC`
                  : chainId && [56, 97].includes(chainId)
                  ? `BNB`
                  : chainId && [43113, 43114].includes(chainId)
                  ? `AVAX`
                  : chainId && [250].includes(chainId)
                  ? `FTM`
                  : chainId && [25, 338].includes(chainId)
                  ? `CRO`
                  : chainId && [199, 1028].includes(chainId)
                  ? 'BTT'
                  : chainId && [ChainId.VELAS, 111].includes(chainId)
                  ? 'VLX'
                  : chainId && [ChainId.OASIS].includes(chainId)
                  ? 'ROSE'
                  : `ETH`}
              </BalanceText>
            ) : null}
            <Web3Status />
          </AccountElement>
        </HeaderElement>
        <HeaderElementWrap>
          <Settings />
          <Menu />
        </HeaderElementWrap>
      </HeaderControls>
    </HeaderFrame>
  )
}
