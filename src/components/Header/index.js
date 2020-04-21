import React from 'react'
import styled from 'styled-components'

import Row from '../Row'
import Menu from '../Menu'
import Logo from '../../assets/svg/logo.svg'
import { Link } from '../../theme'
import { Text } from 'rebass'
import { YellowCard } from '../Card'
import Web3Status from '../Web3Status'

import { WETH } from '@uniswap/sdk'
import { useWeb3React } from '../../hooks'
import { useAddressBalance } from '../../contexts/Balances'
import { useWalletModalToggle, usePopups } from '../../contexts/Application'

const HeaderFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1.25rem;
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

const TitleText = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.black};
  margin-left: 12px;

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
  border-radius: 8px;
  padding-left: ${({ active }) => (active ? '8px' : 0)};
  white-space: nowrap;

  :focus {
    border: 1px solid blue;
  }
`

const TestnetWrapper = styled.div`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    position: absolute; 
    top: 70px;
    right: 20px;
  `};
`

export default function Header() {
  const { account, chainId } = useWeb3React()

  const userEthBalance = useAddressBalance(account, WETH[chainId])
  const toggleWalletModal = useWalletModalToggle()

  const [, addPopup] = usePopups()

  return (
    <HeaderFrame>
      <HeaderElement>
        <Title>
          <Link id="link" href="https://uniswap.io">
            <img src={Logo} alt="logo" />
          </Link>
          <Link id="link" href="https://uniswap.io">
            <TitleText>Uniswap</TitleText>
          </Link>
        </Title>
      </HeaderElement>
      <HeaderElement>
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
        <TestnetWrapper>
          {chainId === 4 && (
            <YellowCard style={{ width: 'fit-content', marginLeft: '10px' }} padding={'6px'}>
              Rinkeby Testnet
            </YellowCard>
          )}
          {chainId === 3 && (
            <YellowCard style={{ width: 'fit-content', marginLeft: '10px' }} padding={'6px'}>
              Ropsten Testnet
            </YellowCard>
          )}
          {chainId === 5 && (
            <YellowCard style={{ width: 'fit-content', marginLeft: '10px' }} padding={'6px'}>
              Goerli Testnet
            </YellowCard>
          )}
          {chainId === 42 && (
            <YellowCard style={{ width: 'fit-content', marginLeft: '10px' }} padding={'6px'}>
              Kovan Testnet
            </YellowCard>
          )}
        </TestnetWrapper>
        <Menu />
      </HeaderElement>
    </HeaderFrame>
  )
}
