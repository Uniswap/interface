import React from 'react'
import styled from 'styled-components'

import Row from '../Row'
import Menu from '../Menu'
import Card, { YellowCard } from '../Card'
import Web3Status from '../Web3Status'
import { X } from 'react-feather'
import { Link } from '../../theme'
import { Text } from 'rebass'
import { AutoColumn } from '../Column'

import { WETH } from '@uniswap/sdk'
import { isMobile } from 'react-device-detect'

import { useWeb3React } from '../../hooks'
import { useAddressBalance } from '../../contexts/Balances'
import { useWalletModalToggle, usePopups } from '../../contexts/Application'

import Logo from '../../assets/svg/logo.svg'
import Wordmark from '../../assets/svg/wordmark.svg'

const HeaderFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  position: absolute;
`

const HeaderElement = styled.div`
  margin: 1.25rem;
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
`

const AccountElement = styled.div`
  display: flex;
  min-width: 0;
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

const FixedPopupColumn = styled(AutoColumn)`
  position: absolute;
  top: 80px;
  right: 20px;
  width: 380px;
`

const StyledClose = styled(X)`
  position: absolute;
  right: 10px;

  :hover {
    cursor: pointer;
  }
`

const Popup = styled(Card)`
  z-index: 9999;
  border-radius: 8px;
  padding: 1rem;
  background-color: white;
`

const NetworkCard = styled(YellowCard)`
  width: fit-content;
  margin-right: 10px;
  border-radius: 12px;
  padding: 8px 12px;
`

export default function Header() {
  const { account, chainId } = useWeb3React()

  const userEthBalance = useAddressBalance(account, WETH[chainId])
  const toggleWalletModal = useWalletModalToggle()

  const [activePopups, , removePopup] = usePopups()

  return (
    <HeaderFrame>
      <HeaderElement>
        <Title>
          <Link id="link" href="https://uniswap.io">
            <img src={Logo} alt="logo" />
          </Link>
          {!isMobile && (
            <>
              <Link id="link" href="https://uniswap.io">
                <img style={{ marginLeft: '4px' }} src={Wordmark} alt="logo" />
              </Link>
              <p style={{ opacity: 0.6, marginLeft: '4px', fontSize: '16px' }}>{'/ Exchange'}</p>
            </>
          )}
        </Title>
      </HeaderElement>
      <HeaderElement>
        {!isMobile && chainId === 4 && <NetworkCard>Rinkeby Testnet</NetworkCard>}
        {!isMobile && chainId === 3 && <NetworkCard> Ropsten Testnet</NetworkCard>}
        {!isMobile && chainId === 5 && <NetworkCard>Goerli Testnet</NetworkCard>}
        {!isMobile && chainId === 42 && <NetworkCard>Kovan Testnet</NetworkCard>}
        <AccountElement active={!!account}>
          {account ? (
            <Row style={{ marginRight: '-1.25rem', paddingRight: '1.75rem' }}>
              <Text fontWeight={400}> {userEthBalance && userEthBalance?.toFixed(4) + ' ETH'}</Text>
            </Row>
          ) : (
            ''
          )}
          <Web3Status onClick={toggleWalletModal} />
        </AccountElement>
        <Menu />
      </HeaderElement>
      <FixedPopupColumn gap="20px">
        {activePopups.map(item => {
          return (
            <Popup key={item.key}>
              <StyledClose color="#888D9B" onClick={() => removePopup(item.key)} />
              {item.content}
            </Popup>
          )
        })}
      </FixedPopupColumn>
    </HeaderFrame>
  )
}
