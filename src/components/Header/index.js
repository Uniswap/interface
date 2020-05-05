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
import { useUserAdvanced, useToggleUserAdvanced } from '../../contexts/Application'
import { Eye, EyeOff, Send } from 'react-feather'

import { ButtonSecondary } from '../Button'

import Logo from '../../assets/svg/logo.svg'
import Wordmark from '../../assets/svg/wordmark.svg'
import { AutoColumn } from '../Column'

const HeaderFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  /* position: absolute; */
  padding: 1rem 1rem;
  width: calc(100% - 2rem);

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
  padding: 8px 12px;
  color: ${({ theme }) => theme.text2};
`

const UniIcon = styled(Link)`
  transition: transform 0.3s ease;
  :hover {
    transform: rotate(-5deg);
  }
`
const StyledRed = styled.div`
  width: 100%;
  height: 150vh;
  border-radius: 10vw;
  background: ${({ theme }) => `radial-gradient(50% 50% at 50% 50%, ${theme.pink2} 0%, ${theme.white} 100%)`};
  position: absolute;
  top: 0px;
  left: 0px;
  opacity: 0.1;
  z-index: -1;

  transform: translateY(-70vh);

  @media (max-width: 960px) {
    height: 300px;
    width: 100%;
    transform: translateY(-150px);
  }
`

const MigrateBanner = styled(AutoColumn)`
  width: 100%;
  padding: 12px 0;
  display: flex;
  justify-content: center;
  background-color: rgba(255, 0, 122, 0.1);
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
  const toggleSimplified = useToggleUserAdvanced()
  const advanced = useUserAdvanced()

  return (
    <AutoColumn style={{ width: '100vw' }}>
      <MigrateBanner>
        <StyledRed />
        <b>Uniswap V2 is live.&nbsp;</b> Move your liquidity now using the&nbsp;
        <a href="https://migrate.uniswap.exchange/">migration helper</a>&nbsp; or read the&nbsp;
        <a href="https://uniswap.org/blog/uniswap-v2/">announcement </a>
      </MigrateBanner>
      <HeaderFrame>
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
            <TestnetWrapper>{!isMobile && <Alpha>1.0.0-alpha</Alpha>}</TestnetWrapper>
          </Title>
        </HeaderElement>
        <HeaderElement>
          <ButtonSecondary
            style={{
              padding: ' 8px 12px',
              marginRight: '0px',
              width: 'fit-content',
              position: 'fixed',
              right: '1rem',
              bottom: '1rem'
            }}
          >
            <Send size={16} style={{ marginRight: '8px' }} /> Feeback
          </ButtonSecondary>
          <ButtonSecondary
            style={{ padding: '6px 8px', marginRight: '0px', width: 'fit-content' }}
            onClick={toggleSimplified}
          >
            {' '}
            {advanced ? <EyeOff size={20} /> : <Eye size={20} />}
          </ButtonSecondary>

          <TestnetWrapper>
            {!isMobile && chainId === 4 && <NetworkCard>Rinkeby</NetworkCard>}
            {!isMobile && chainId === 3 && <NetworkCard>Ropsten</NetworkCard>}
            {!isMobile && chainId === 5 && <NetworkCard>Goerli</NetworkCard>}
            {!isMobile && chainId === 42 && <NetworkCard>Kovan</NetworkCard>}
          </TestnetWrapper>
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
      </HeaderFrame>
    </AutoColumn>
  )
}
