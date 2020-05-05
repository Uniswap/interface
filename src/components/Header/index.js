import React from 'react'
import styled from 'styled-components'

import Row from '../Row'
import Menu from '../Menu'
import Web3Status from '../Web3Status'

import { Link } from '../../theme'
import { Text } from 'rebass'
import { WETH } from '@uniswap/sdk'
import { isMobile } from 'react-device-detect'
import { YellowCard, GreyCard } from '../Card'
import { useWeb3React } from '../../hooks'
import { useAddressBalance } from '../../contexts/Balances'
import { useWalletModalToggle } from '../../contexts/Application'

import Logo from '../../assets/svg/logo.svg'
import Wordmark from '../../assets/svg/wordmark.svg'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'

const HeaderFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  width: 100%;
  top: 0;
  position: absolute;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 10px;
    width: calc(100% - 20px);
  `};
  z-index: 2;
`

const HeaderElement = styled.div`
  display: flex;
  min-width: 0;
  display: flex;
  align-items: center;
`

const Title = styled.div`
  display: flex;
  align-items: center;

  :hover {
    cursor: pointer;
  }
`

const TitleText = styled(Row)`
  width: fit-content;
  white-space: nowrap;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const AccountElement = styled.div`
  display: flex;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.white : theme.bg3)};
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 12px;
  padding-left: ${({ active }) => (active ? '8px' : 0)};
  white-space: nowrap;

  :focus {
    border: 1px solid blue;
  }
`

const TestnetWrapper = styled.div`
  white-space: nowrap;
  width: fit-content;
  margin-left: 10px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const NetworkCard = styled(YellowCard)`
  width: fit-content;
  margin-right: 10px;
  border-radius: 12px;
  padding: 8px 12px;
`
const Alpha = styled(GreyCard)`
  width: fit-content;
  margin-right: 10px;
  border-radius: 12px;
  padding: 3px 7px;
  background-color: ${({ theme }) => theme.blue1};
  color: ${({ theme }) => theme.white};
  font-size: 12px;
  font-weight: 600;
`

const UniIcon = styled(Link)`
  transition: transform 0.3s ease;
  :hover {
    transform: rotate(-5deg);
  }
`

const MigrateBanner = styled(AutoColumn)`
  width: 100%;
  padding: 12px 0;
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.blue4};
  color: ${({ theme }) => theme.pink2};
  font-weight: 500;
  text-align: center;
  a {
    color: ${({ theme }) => theme.pink2};
  }
`

export default function Header() {
  const { account, chainId } = useWeb3React()

  const userEthBalance = useAddressBalance(account, WETH[chainId])
  const toggleWalletModal = useWalletModalToggle()

  return (
    <HeaderFrame>
      <MigrateBanner>
        {/* <b>Uniswap V2 is live.&nbsp;</b> Move your liquidity now using the&nbsp; */}
        <b>Testnet only.</b>&nbsp;Uniswap V2 has not been launched and is coming soon.&nbsp;Read the&nbsp;
        {/* <Link href="https://migrate.uniswap.exchange/">
          <b>migration helper</b>
        </Link>
        &nbsp;or read the&nbsp; */}
        <Link href="https://uniswap.org/blog/uniswap-v2/">
          <b>blog post ↗</b>
        </Link>
      </MigrateBanner>
      <RowBetween padding="1rem">
        <HeaderElement>
          <Title>
            <UniIcon id="link" href="/">
              <img src={Logo} alt="logo" />
            </UniIcon>
            {!isMobile && (
              <TitleText>
                <Link id="link" href="/">
                  <img style={{ marginLeft: '4px', marginTop: '4px' }} src={Wordmark} alt="logo" />
                </Link>
              </TitleText>
            )}
          </Title>
          <TestnetWrapper>{!isMobile && <Alpha>V2</Alpha>}</TestnetWrapper>
        </HeaderElement>
        <HeaderElement>
          <TestnetWrapper>
            {!isMobile && chainId === 4 && <NetworkCard>Rinkeby</NetworkCard>}
            {!isMobile && chainId === 3 && <NetworkCard>Ropsten</NetworkCard>}
            {!isMobile && chainId === 5 && <NetworkCard>Goerli</NetworkCard>}
            {!isMobile && chainId === 42 && <NetworkCard>Kovan</NetworkCard>}
          </TestnetWrapper>
          <AccountElement active={!!account}>
            {account ? (
              <Row style={{ marginRight: '-1.25rem', paddingRight: '1.75rem' }}>
                <Text fontWeight={500}> {userEthBalance && userEthBalance?.toFixed(4) + ' ETH'}</Text>
              </Row>
            ) : (
              ''
            )}
            <Web3Status onClick={toggleWalletModal} />
          </AccountElement>

          <Menu />
        </HeaderElement>
      </RowBetween>
    </HeaderFrame>
    // </AutoColumn>
  )
}
