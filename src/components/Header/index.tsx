import 'rc-drawer/assets/index.css'

import { ChainId, useContractKit } from '@celo-tools/use-contractkit'
import { CELO, ChainId as UbeswapChainId, TokenAmount } from '@ubeswap/sdk'
import { CardNoise } from 'components/earn/styled'
import Modal from 'components/Modal'
import Hamburger from 'hamburger-react'
import usePrevious from 'hooks/usePrevious'
import { darken } from 'polished'
import Drawer from 'rc-drawer'
import React, { useState } from 'react'
import { Moon, Sun } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { Text } from 'rebass'
import { useAggregateUbeBalance, useTokenBalance } from 'state/wallet/hooks'
import styled from 'styled-components'
import { TYPE } from 'theme'
import { ExternalLink } from 'theme/components'
import { CountUp } from 'use-count-up'
import { relevantDigits } from 'utils/relevantDigits'

import Icon from '../../assets/svg/icon-ube.svg'
import Logo from '../../assets/svg/logo.svg'
import LogoDark from '../../assets/svg/logo-dark.svg'
import { useDarkModeManager } from '../../state/user/hooks'
import { YellowCard } from '../Card'
import Menu from '../Menu'
import Row, { RowFixed } from '../Row'
import Web3Status from '../Web3Status'
import BridgeMenuGroup from './BridgeMenuGroup'
import ChartsMenuGroup from './ChartsMenuGroup'
import UbeBalanceContent from './UbeBalanceContent'

const HeaderFrame = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: center;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem;
  z-index: 2;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    padding: 0 1rem;
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

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: row;
    justify-content: space-between;
    justify-self: center;
    width: 100%;
    max-width: 960px;
    padding: 1rem;
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 100%;
    z-index: 99;
    height: 72px;
    border-radius: 12px 12px 0 0;
    background-color: ${({ theme }) => theme.bg1};
  `};
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;

  /* addresses safari's lack of support for "gap" */
  & > *:not(:first-child) {
    margin-left: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
   flex-direction: row-reverse;
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
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem 0 1rem 1rem;
    justify-content: flex-end;
`};
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg3)};
  border-radius: 12px;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;

  :focus {
    border: 1px solid blue;
  }
`

const HideSmall = styled.span`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const NetworkCard = styled(YellowCard)`
  border-radius: 12px;
  padding: 8px 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  `};
`

const BalanceText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const Title = styled(NavLink)`
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

const UbeIcon = styled.div`
  transition: transform 0.3s ease;
  :hover {
    transform: rotate(-5deg);
  }
`

const activeClassName = 'ACTIVE'

export const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }

  @media (max-width: 320px) {
    margin: 0 8px;
  }
`

export const StyledNavLinkExtraSmall = styled(StyledNavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `}
`

const StyledExternalLink = styled(ExternalLink).attrs({
  activeClassName,
})<{ isActive?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      display: none;
`}
`

export const StyledMenuButton = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg3};
  margin-left: 8px;
  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg4};
  }

  svg {
    margin-top: 2px;
  }
  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

export const StyledDesktopLogo = styled.img`
  display: inline;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;  
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: inline;  
  `};
  @media (max-width: 385px) {
    display: none;
  }
`

export const StyledMobileLogo = styled.img`
  display: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: inline;  
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;  
  `};
  @media (max-width: 385px) {
    display: inline;
  }
`

export const BurgerElement = styled(HeaderElement)`
  display: none;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: flex;  
  `};
`

export const StyledDrawer = styled(Drawer)`
  & .drawer-content-wrapper {
    background: ${({ theme }) => theme.bg3};
    color: ${({ theme }) => theme.text1};
  }
`

export const StyledMenu = styled.ul`
  padding-left: 0px;
  list-style: none;
`
export const StyledMenuItem = styled.li`
  padding: 10px 0px 10px 20px;
`
export const StyledSubMenuItem = styled(StyledMenuItem)`
  padding-left: 30px;
`

const StyledDrawerExternalLink = styled(StyledExternalLink).attrs({
  activeClassName,
})<{ isActive?: boolean }>`
  text-decoration: none;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      display: flex;
`}
`

const NETWORK_LABELS: { [chainId in ChainId]?: string } = {
  [ChainId.CeloMainnet]: 'Celo',
  [ChainId.Alfajores]: 'Alfajores',
  [ChainId.Baklava]: 'Baklava',
  [ChainId.EthereumMainnet]: 'Ethereum',
  [ChainId.Kovan]: 'Kovan',
}

export default function Header() {
  const { address: account, network } = useContractKit()
  const chainId = network.chainId
  const { t } = useTranslation()

  const userCELOBalance = useTokenBalance(account ?? undefined, CELO[chainId as unknown as UbeswapChainId])
  const [darkMode, toggleDarkMode] = useDarkModeManager()
  const [showUbeBalanceModal, setShowUbeBalanceModal] = useState<boolean>(false)
  const aggregateBalance: TokenAmount | undefined = useAggregateUbeBalance()
  const countUpValue = relevantDigits(aggregateBalance)
  const countUpValuePrevious = usePrevious(countUpValue) ?? '0'

  const [drawerVisible, setDrawerVisible] = useState<boolean>(false)

  const onDrawerClose = () => {
    setDrawerVisible(false)
  }

  const onToggle = (toggled: boolean) => {
    setDrawerVisible(toggled)
  }

  return (
    <HeaderFrame>
      <Modal isOpen={showUbeBalanceModal} onDismiss={() => setShowUbeBalanceModal(false)}>
        <UbeBalanceContent setShowUbeBalanceModal={setShowUbeBalanceModal} />
      </Modal>
      <HeaderRow>
        <Title to="/">
          <UbeIcon>
            <StyledMobileLogo width={'32px'} height={'36px'} src={Icon} alt="Ubeswap" />
            <StyledDesktopLogo width={'140px'} height={'26px'} src={darkMode ? LogoDark : Logo} alt="Ubeswap" />
          </UbeIcon>
        </Title>
        <HeaderLinks>
          <StyledNavLink id={`swap-nav-link`} to={'/swap'}>
            {t('swap')}
          </StyledNavLink>
          <StyledNavLinkExtraSmall id={`swap-nav-link`} to={'/limit-order'}>
            {t('limitOrder')}
          </StyledNavLinkExtraSmall>
          <StyledNavLink
            id={`pool-nav-link`}
            to={'/pool'}
            isActive={(match, { pathname }) =>
              Boolean(match) ||
              pathname.startsWith('/add') ||
              pathname.startsWith('/remove') ||
              pathname.startsWith('/create') ||
              pathname.startsWith('/find')
            }
          >
            {t('pool')}
          </StyledNavLink>
          <StyledNavLink id="farm-nav-link" to="/farm">
            {t('farm')}
          </StyledNavLink>
          <BridgeMenuGroup />
          <StyledNavLinkExtraSmall id={`stake-nav-link`} to={'/stake'}>
            {t('stake')}
          </StyledNavLinkExtraSmall>
          <ChartsMenuGroup />
        </HeaderLinks>
        <BurgerElement>
          <Hamburger size={18} hideOutline={false} label="show menu" toggled={drawerVisible} onToggle={onToggle} />
          <StyledDrawer
            open={drawerVisible}
            placement={'right'}
            width={'250px'}
            level={null}
            handler={false}
            onClose={onDrawerClose}
          >
            <StyledMenu>
              <StyledMenuItem>
                <StyledNavLink id={'stake-drawer-nav-link'} to={'/stake'} onClick={onDrawerClose}>
                  {t('stake')}
                </StyledNavLink>
              </StyledMenuItem>
              <StyledMenuItem>
                <StyledNavLink id={'limit-orders-drawer-nav-link'} to={'/limit-order'} onClick={onDrawerClose}>
                  Limit Orders
                </StyledNavLink>
              </StyledMenuItem>
              <StyledMenuItem>
                <StyledNavLink id={'stake-drawer-nav-link'} to={'#'}>
                  Bridge
                </StyledNavLink>
              </StyledMenuItem>
              <StyledSubMenuItem>
                <StyledDrawerExternalLink id={`stake-drawer-nav-link`} href={'https://allbridge.io/'}>
                  Allbridge
                </StyledDrawerExternalLink>
              </StyledSubMenuItem>
              <StyledSubMenuItem>
                <StyledDrawerExternalLink id={`stake-drawer-nav-link`} href={'https://app.multichain.org/#/router'}>
                  Multichain
                </StyledDrawerExternalLink>
              </StyledSubMenuItem>
              <StyledSubMenuItem>
                <StyledDrawerExternalLink id={`stake-drawer-nav-link`} href={'https://optics.app/'}>
                  Optics
                </StyledDrawerExternalLink>
              </StyledSubMenuItem>
              <StyledSubMenuItem>
                <StyledDrawerExternalLink id={`stake-drawer-nav-link`} href={'https://bridge.orbitchain.io/'}>
                  Orbit
                </StyledDrawerExternalLink>
              </StyledSubMenuItem>
              <StyledMenuItem>
                <StyledNavLink id={'charts-drawer-nav-link'} to={'#'}>
                  Charts
                </StyledNavLink>
              </StyledMenuItem>
              <StyledSubMenuItem>
                <StyledDrawerExternalLink id={`charts-analytics-drawer-nav-link`} href={'https://info.ubeswap.org/'}>
                  Analytics
                </StyledDrawerExternalLink>
              </StyledSubMenuItem>
              <StyledSubMenuItem>
                <StyledDrawerExternalLink id={`charts-celo-tracker-drawer-nav-link`} href={'https://celotracker.com/'}>
                  Celo Tracker
                </StyledDrawerExternalLink>
              </StyledSubMenuItem>
            </StyledMenu>
          </StyledDrawer>
        </BurgerElement>
      </HeaderRow>
      <HeaderControls>
        <HeaderElement>
          <HideSmall>
            {chainId && NETWORK_LABELS[chainId] && (
              <NetworkCard title={NETWORK_LABELS[chainId]}>{NETWORK_LABELS[chainId]}</NetworkCard>
            )}
          </HideSmall>

          {aggregateBalance && (
            <UBEWrapper onClick={() => setShowUbeBalanceModal(true)}>
              <UBEAmount active={!!account} style={{ pointerEvents: 'auto' }}>
                {account && (
                  <HideSmall>
                    <TYPE.white
                      style={{
                        paddingRight: '.4rem',
                      }}
                    >
                      <CountUp
                        key={countUpValue}
                        isCounting
                        start={parseFloat(countUpValuePrevious)}
                        end={parseFloat(countUpValue)}
                        thousandsSeparator={','}
                        duration={1}
                      />
                    </TYPE.white>
                  </HideSmall>
                )}
                UBE
              </UBEAmount>
              <CardNoise />
            </UBEWrapper>
          )}

          <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
            {account && userCELOBalance ? (
              <BalanceText style={{ flexShrink: 0 }} pl="0.75rem" pr="0.5rem" fontWeight={500}>
                {relevantDigits(userCELOBalance) ?? '0.00'} CELO
              </BalanceText>
            ) : null}
            <Web3Status />
          </AccountElement>
        </HeaderElement>
        <HeaderElementWrap>
          <StyledMenuButton aria-label={t('toggleDarkMode')} onClick={() => toggleDarkMode()}>
            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
          </StyledMenuButton>
          <Menu />
        </HeaderElementWrap>
      </HeaderControls>
    </HeaderFrame>
  )
}

const UBEAmount = styled(AccountElement)`
  color: white;
  padding: 4px 8px;
  height: 36px;
  font-weight: 500;
  background-color: ${({ theme }) => theme.bg3};
  background: radial-gradient(174.47% 188.91% at 1.84% 0%, ${({ theme }) => theme.primary1} 0%, #2172e5 100%), #edeef2;
`

const UBEWrapper = styled.span`
  width: fit-content;
  position: relative;
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
  :active {
    opacity: 0.9;
  }
`
