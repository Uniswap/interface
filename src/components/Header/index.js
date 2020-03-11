import React from 'react'
import styled from 'styled-components'

import Menu from '../Menu'
import Logo from '../../assets/svg/logo.svg'
import Row from '../Row'
import Web3Status from '../Web3Status'
import { CloseIcon } from '../../theme/components'
import { Link } from '../../theme'
import { Text } from 'rebass'
import Card from '../Card'
import { X } from 'react-feather'

import { WETH } from '@uniswap/sdk'
import { isMobile } from 'react-device-detect'

import { useWeb3React } from '../../hooks'
import { useAddressBalance } from '../../contexts/Balances'
import { useWalletModalToggle, usePopups } from '../../contexts/Application'

const HeaderFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
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
  background: linear-gradient(119.64deg, #fb1868 -5.55%, #ff00f3 154.46%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-left: 12px;
`

const AccountElement = styled.div`
  display: flex;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.outlineGrey};
  border: 1px solid ${({ theme }) => theme.outlineGrey};
  border-radius: 8px;
  padding-left: 8px;

  :focus {
    border: 1px solid blue;
  }
  /* width: 100%; */
`

const FixedPopupColumn = styled.div`
  position: absolute;
  top: 80px;
  right: 20px
  width: 340px;
`

const StyledClose = styled(X)`
  position: absolute;
  right: 10px;

  :hover {
    cursor: pointer;
  }
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
          <Link id="link" href="https://uniswap.io">
            <TitleText>Uniswap</TitleText>
          </Link>
        </Title>
      </HeaderElement>
      <HeaderElement>
        <AccountElement>
          {!isMobile ? (
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
      <FixedPopupColumn>
        {activePopups.map(item => {
          return (
            <Card bg="white" padding={'16px'} key={item.key} borderRadius={'8px'}>
              <StyledClose color="#888D9B" onClick={() => removePopup(item.key)} />
              {item.content}
            </Card>
          )
        })}
      </FixedPopupColumn>
    </HeaderFrame>
  )
}
