import { ChainId } from '@fuseio/fuse-swap-sdk'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { Text } from 'rebass'
import { ExternalLink as ExternalLinkIcon } from 'react-feather'

import styled from 'styled-components'

import Logo from '../../assets/images/logo.png'
import { useActiveWeb3React } from '../../hooks'
import { useETHBalances } from '../../state/wallet/hooks'

import { YellowCard } from '../Card'
import Settings from '../Settings'
import Menu from '../Menu'

import { RowBetween } from '../Row'
import Web3Status from '../Web3Status'
import { getNativeCurrencySymbol } from '../../utils'
import { TYPE, ExternalLink } from '../../theme'
import { BINANCE_MAINNET_CHAINID, BINANCE_TESTNET_CHAINID } from '../../constants'

const HeaderFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  width: 100%;
  top: 0;
  position: absolute;
  z-index: 3;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 12px 0 0 0;
    width: calc(100%);
    position: relative;
  `};
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;
`

const HeaderElementWrap = styled.div`
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-top: 0.5rem;
`};
`

const Title = styled.a`
  display: flex;
  align-items: center;
  pointer-events: auto;

  :hover {
    cursor: pointer;
  }
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg3)};
  border-radius: 12px;
  white-space: nowrap;
  width: 100%;

  :focus {
    border: 1px solid blue;
  }
`

const TestnetWrapper = styled.div`
  white-space: nowrap;
  width: fit-content;
  margin-left: 10px;
  pointer-events: auto;
`

const NetworkCard = styled(YellowCard)`
  width: fit-content;
  margin-right: 10px;
  border-radius: 12px;
  padding: 8px 12px;
`

const UniIcon = styled.div`
  img {
    width: 10.5rem;

    ${({ theme }) => theme.mediaWidth.upToSmall`
      width: 7.5rem;
    `}
  }
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: flex-end;
  `};
`

const BalanceText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const HeaderLink = styled(ExternalLink)`
  display: flex;
  align-items: center;
  font-weight: 400;
  color: white;
  margin-right: 10px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `}
`

const MobileBalanceElement = styled.div`
  display: none;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.bg3};
  margin-top: 0.5rem;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: flex; 
  `}
`

const MobileBalanceText = styled(Text)`
  padding: 0.5rem;
  font-weight: 500;
`

export const NETWORK_LABELS: any = {
  [ChainId.MAINNET]: 'Ethereum',
  [ChainId.RINKEBY]: 'Rinkeby',
  [ChainId.ROPSTEN]: 'Ropsten',
  [ChainId.GÖRLI]: 'Görli',
  [ChainId.KOVAN]: 'Kovan',
  [ChainId.FUSE]: 'Fuse',
  [BINANCE_TESTNET_CHAINID]: 'Binance Testnet',
  [BINANCE_MAINNET_CHAINID]: 'Binance'
}

export default function Header() {
  const { account, chainId } = useActiveWeb3React()

  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']

  return (
    <HeaderFrame>
      <RowBetween style={{ alignItems: 'flex-start' }} padding="1rem 1rem 0 1rem">
        <HeaderElement>
          <Title href="." style={{ textDecoration: 'none' }}>
            <UniIcon>
              <img src={Logo} alt="logo" />
            </UniIcon>
            <TYPE.body fontSize={12} fontWeight={700} marginLeft={2}>
              BETA
            </TYPE.body>
          </Title>
        </HeaderElement>
        <HeaderControls>
          <HeaderElement>
            <HeaderLink target="_blank" href="https://rewards.fuse.io">
              Farming <ExternalLinkIcon style={{ marginLeft: 5 }} size={14} />
            </HeaderLink>
            <HeaderLink target="_blank" href="https://info.fuseswap.com" style={{ marginRight: 0 }}>
              Analytics <ExternalLinkIcon style={{ marginLeft: 5 }} size={14} />
            </HeaderLink>
            <TestnetWrapper>
              {!isMobile && chainId && NETWORK_LABELS[chainId] && <NetworkCard>{NETWORK_LABELS[chainId]}</NetworkCard>}
            </TestnetWrapper>
            <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
              {account && userEthBalance ? (
                <BalanceText style={{ flexShrink: 0 }} pl="0.75rem" pr="0.5rem" fontWeight={500}>
                  {userEthBalance?.toSignificant(4)} {getNativeCurrencySymbol(chainId)}
                </BalanceText>
              ) : null}
              <Web3Status />
            </AccountElement>
          </HeaderElement>
          <MobileBalanceElement>
            {account && userEthBalance ? (
              <MobileBalanceText>
                {userEthBalance?.toSignificant(4)} {getNativeCurrencySymbol(chainId)}
              </MobileBalanceText>
            ) : null}
          </MobileBalanceElement>
          <HeaderElementWrap>
            <Settings />
            <Menu />
          </HeaderElementWrap>
        </HeaderControls>
      </RowBetween>
    </HeaderFrame>
  )
}
