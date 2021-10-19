import { ChainId, ETHER } from '@dynamic-amm/sdk'
import React from 'react'
import { Text } from 'rebass'
import { NavLink } from 'react-router-dom'
import { darken } from 'polished'
import { Trans } from '@lingui/macro'
import styled from 'styled-components'

import { DMM_ANALYTICS_URL, KNC } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useETHBalances } from '../../state/wallet/hooks'
import Settings from '../Settings'
import Menu from '../Menu'
import Row, { RowFixed } from '../Row'
import Web3Status from '../Web3Status'
import { ExternalLink } from 'theme/components'
import { convertToNativeTokenFromETH } from 'utils/dmm'
import Web3Network from 'components/Web3Network'

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
    z-index: 99;
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
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem 0 1rem 1rem;
    justify-content: flex-end;
  `};
`

const IconImage = styled.img`
  width: 100px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 40px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 60px;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 70px;
  `};
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg3)};
  border-radius: 8px;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;

  :focus {
    border: 1px solid blue;
  }
`

const HideExtraSmall = styled.span`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const HideSmall = styled.span`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const HideText = styled.span`
  @media (max-width: 1400px) {
    display: none;
  }
`

const AnalyticsWrapper = styled.span`
  @media (max-width: 1100px) {
    display: none;
  }
`

const MigrateLiquidityWrapper = styled.span`
  @media (max-width: 1250px) {
    display: none;
  }
`

const AboutWrapper = styled.span`
  @media (max-width: 1320px) {
    display: none;
  }
`

const BridgeExternalLink = styled(ExternalLink)`
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 16px;
  color: inherit;
  border: 1px solid ${({ theme }) => theme.bg3};
  white-space: nowrap;
  :hover {
    text-decoration: none;
  }
`

const BalanceText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const Title = styled.a`
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
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName
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
`

const StyledNavExternalLink = styled(ExternalLink).attrs({
  activeClassName
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
    text-decoration: none;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      display: none;
  `}
`

const YieldMenuWrapper = styled.div`
  position: relative;
  padding: 10px 16px 10px 0;
`

const NewText = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  font-size: 10px;
  font-weight: 500;
  color: #ff537b;
`

const getPoolsMenuLink = (chainId?: ChainId) => {
  switch (chainId) {
    case ChainId.MAINNET:
      return `/pools/${convertToNativeTokenFromETH(ETHER, chainId).symbol}/${KNC[chainId as ChainId].address}`
    case ChainId.ROPSTEN:
      return `/pools/${convertToNativeTokenFromETH(ETHER, chainId).symbol}/${KNC[chainId as ChainId].address}`
    case ChainId.MATIC:
      return `/pools/0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619/${KNC[chainId as ChainId].address}`
    case ChainId.MUMBAI:
      return `/pools/0x19395624C030A11f58e820C3AeFb1f5960d9742a/${KNC[chainId as ChainId].address}`
    case ChainId.BSCTESTNET:
      return `/pools/BNB`
    case ChainId.BSCMAINNET:
      return `/pools/BNB`
    case ChainId.AVAXTESTNET:
      return `/pools/AVAX`
    case ChainId.AVAXMAINNET:
      return `/pools/AVAX`
    default:
      return '/pools/ETH'
  }
}

export default function Header() {
  const { account, chainId } = useActiveWeb3React()
  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']

  const poolsMenuLink = getPoolsMenuLink(chainId)

  const getBridgeLink = () => {
    if (!chainId) return ''
    if ([ChainId.MATIC, ChainId.MUMBAI].includes(chainId)) return 'https://wallet.matic.network/bridge'
    if ([ChainId.BSCMAINNET, ChainId.BSCTESTNET].includes(chainId)) return 'https://www.binance.org/en/bridge'
    if ([ChainId.AVAXMAINNET, ChainId.AVAXTESTNET].includes(chainId)) return 'https://bridge.avax.network'
    return ''
  }

  const bridgeLink = getBridgeLink()

  return (
    <HeaderFrame>
      <HeaderRow>
        <Title href=".">
          <UniIcon>
            <IconImage src="logo.svg" alt="logo" />
          </UniIcon>
        </Title>
        <HeaderLinks>
          {/*<StyledNavLink id={`swap-nav-link`} to={'/swap'}>
            <Trans>Swap</Trans>
          </StyledNavLink>
          */}
          <StyledNavLink id={`swapv2-nav-link`} to={'/swap'}>
            <Trans>Swap</Trans>
          </StyledNavLink>
          <StyledNavLink id={`pools-nav-link`} to={poolsMenuLink} isActive={match => Boolean(match)}>
            <Trans>Pools</Trans>
          </StyledNavLink>

          <HideSmall>
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
          </HideSmall>

          <StyledNavLink id={`farms-nav-link`} to={'/farms'} isActive={match => Boolean(match)}>
            <YieldMenuWrapper>
              <Trans>Farm</Trans>
              <NewText>
                <Trans>New</Trans>
              </NewText>
            </YieldMenuWrapper>
          </StyledNavLink>

          <AnalyticsWrapper>
            <StyledNavExternalLink href={DMM_ANALYTICS_URL[chainId as ChainId]}>
              <Trans>Analytics</Trans>
            </StyledNavExternalLink>
          </AnalyticsWrapper>

          {chainId && [ChainId.MAINNET, ChainId.ROPSTEN].includes(chainId) && (
            <MigrateLiquidityWrapper>
              <StyledNavLink
                id={`migrations-nav-link`}
                to={'/migration'}
                isActive={(match, { pathname }) =>
                  Boolean(match) || pathname.startsWith('/migrate') || pathname.startsWith('/findUNI')
                }
              >
                <Trans>Migrate Liquidity</Trans>
              </StyledNavLink>
            </MigrateLiquidityWrapper>
          )}

          <AboutWrapper>
            <StyledNavLink id={`about`} to={'/about'} isActive={match => Boolean(match)}>
              <Trans>About</Trans>
            </StyledNavLink>
          </AboutWrapper>
        </HeaderLinks>
      </HeaderRow>
      <HeaderControls>
        <HeaderElement>
          {bridgeLink && (
            <HideExtraSmall>
              <BridgeExternalLink href={bridgeLink}>
                <HideText>
                  <Trans>Bridge Assets</Trans>
                </HideText>
                ↗
              </BridgeExternalLink>
            </HideExtraSmall>
          )}
          <Web3Network />

          <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
            {account && userEthBalance ? (
              <BalanceText style={{ flexShrink: 0 }} pl="0.75rem" pr="0.5rem" fontWeight={500}>
                {userEthBalance?.toSignificant(4)}{' '}
                {chainId && [1, 3, 4, 5, 42].includes(chainId)
                  ? `ETH`
                  : chainId && [137, 80001].includes(chainId)
                  ? `MATIC`
                  : chainId && [43113, 43114].includes(chainId)
                  ? `AVAX`
                  : `BNB`}
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
