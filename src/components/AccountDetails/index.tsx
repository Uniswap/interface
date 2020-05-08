import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { useWeb3React } from '../../hooks'
import { isMobile } from 'react-device-detect'
import Copy from './Copy'
import Transaction from './Transaction'

import { SUPPORTED_WALLETS } from '../../constants'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import { getEtherscanLink } from '../../utils'
import { injected, walletconnect, walletlink, fortmatic, portis } from '../../connectors'
import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import FortmaticIcon from '../../assets/images/fortmaticIcon.png'
import PortisIcon from '../../assets/images/portisIcon.png'
import Identicon from '../Identicon'

import { ButtonEmpty } from '../Button'

import { Link, TYPE } from '../../theme'

const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 1rem 1rem;
  font-weight: 500;
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.blue1 : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const UpperSection = styled.div`
  position: relative;

  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`

const InfoCard = styled.div`
  padding: 1rem;
  /* border: 1px solid ${({ theme }) => theme.bg2}; */
  background-color: ${({ theme }) => theme.bg2}; 
  border-radius: 20px;
`

const AccountGroupingRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: ${({ theme }) => theme.text1};

  div {
    ${({ theme }) => theme.flexRowNoWrap}
    align-items: center;
  }

  &:first-of-type {
    margin-bottom: 20px;
  }
`

const AccountSection = styled.div`
  background-color: ${({ theme }) => theme.bg1};
  padding: 0rem 1rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 0rem 1rem 1rem 1rem;`};
`

const YourAccount = styled.div`
  h5 {
    margin: 0 0 1rem 0;
    font-weight: 400;
  }

  h4 {
    margin: 0;
    font-weight: 500;
  }
`

const GreenCircle = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: center;
  align-items: center;

  &:first-child {
    height: 8px;
    width: 8px;
    margin-left: 12px;
    margin-right: 2px;
    background-color: ${({ theme }) => theme.green1};
    border-radius: 50%;
  }
`

const CircleWrapper = styled.div`
  color: ${({ theme }) => theme.green1};
  display: flex;
  justify-content: center;
  align-items: center;
`

const LowerSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  padding: 2rem;
  flex-grow: 1;
  overflow: auto;
  background-color: ${({ theme }) => theme.bg2};
  border-bottom-left-radius: 25px;
  border-bottom-right-radius: 20px;

  h5 {
    margin: 0;
    font-weight: 400;
    color: ${({ theme }) => theme.text3};
  }
`

const AccountControl = styled.div<{ hasENS: boolean; isENS: boolean; }>`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  min-width: 0;

  font-weight: ${({ hasENS, isENS }) => (hasENS ? (isENS ? 500 : 400) : 500)};
  font-size: ${({ hasENS, isENS }) => (hasENS ? (isENS ? '1rem' : '0.8rem') : '1rem')};

  a:hover {
    text-decoration: underline;
  }

  a {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const ConnectButtonRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  margin: 10px 0;
`

const StyledLink = styled(Link) <{ hasENS: boolean; isENS: boolean; }>`
  color: ${({ hasENS, isENS, theme }) => (hasENS ? (isENS ? theme.blue1 : theme.text3) : theme.blue1)};
`

const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 14px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text4};
  }
`

const WalletName = styled.div`
  padding-left: 0.5rem;
  width: initial;
`

const IconWrapper = styled.div<{size?: number}>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

const TransactionListWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
`

const WalletAction = styled.div`
  color: ${({ theme }) => theme.text4};
  margin-left: 16px;
  font-weight: 400;
  :hover {
    cursor: pointer;
    text-decoration: underline;
  }
`

const MainWalletAction = styled(WalletAction)`
  color: ${({ theme }) => theme.blue1};
`

function renderTransactions(transactions, pending) {
  return (
    <TransactionListWrapper>
      {transactions.map((hash, i) => {
        return <Transaction key={i} hash={hash} pending={pending}/>
      })}
    </TransactionListWrapper>
  )
}

export default function AccountDetails({
                                         toggleWalletModal,
                                         pendingTransactions,
                                         confirmedTransactions,
                                         ENSName,
                                         openOptions
                                       }) {
  const { chainId, account, connector } = useWeb3React()
  const theme = useContext(ThemeContext)

  function formatConnectorName() {
    const { ethereum } = window as any
    const isMetaMask = ethereum && ethereum.isMetaMask ? true : false
    const name = Object.keys(SUPPORTED_WALLETS)
      .filter(
        k =>
          SUPPORTED_WALLETS[k].connector === connector && (connector !== injected || isMetaMask === (k === 'METAMASK'))
      )
      .map(k => SUPPORTED_WALLETS[k].name)[0]
    return <WalletName>{name}</WalletName>
  }

  function getStatusIcon() {
    if (connector === injected) {
      return (
        <IconWrapper size={16}>
          <Identicon/> {formatConnectorName()}
        </IconWrapper>
      )
    } else if (connector === walletconnect) {
      return (
        <IconWrapper size={16}>
          <img src={WalletConnectIcon} alt={''}/> {formatConnectorName()}
        </IconWrapper>
      )
    } else if (connector === walletlink) {
      return (
        <IconWrapper size={16}>
          <img src={CoinbaseWalletIcon} alt={''}/> {formatConnectorName()}
        </IconWrapper>
      )
    } else if (connector === fortmatic) {
      return (
        <IconWrapper size={16}>
          <img src={FortmaticIcon} alt={''}/> {formatConnectorName()}
        </IconWrapper>
      )
    } else if (connector === portis) {
      return (
        <>
          <IconWrapper size={16}>
            <img src={PortisIcon} alt={''}/> {formatConnectorName()}
            <MainWalletAction
              onClick={() => {
                portis.portis.showPortis()
              }}
            >
              Show Portis
            </MainWalletAction>
          </IconWrapper>
        </>
      )
    }
  }

  return (
    <>
      <UpperSection>
        <CloseIcon onClick={toggleWalletModal}>
          <CloseColor/>
        </CloseIcon>
        <HeaderRow>Account</HeaderRow>
        <AccountSection>
          <YourAccount>
            <InfoCard>
              <AccountGroupingRow>
                {getStatusIcon()}
                <div>
                  {connector !== injected && connector !== walletlink && (
                    <WalletAction
                      onClick={() => {
                        (connector as any).close()
                      }}
                    >
                      Disconnect
                    </WalletAction>
                  )}
                  <CircleWrapper>
                    <GreenCircle>
                      <div/>
                    </GreenCircle>
                  </CircleWrapper>
                </div>
              </AccountGroupingRow>
              <AccountGroupingRow>
                {ENSName ? (
                  <AccountControl hasENS={!!ENSName} isENS={true}>
                    <StyledLink hasENS={!!ENSName} isENS={true} href={getEtherscanLink(chainId, ENSName, 'address')}>
                      {ENSName} ↗{' '}
                    </StyledLink>
                    <Copy toCopy={ENSName}/>
                  </AccountControl>
                ) : (
                  <AccountControl hasENS={!!ENSName} isENS={false}>
                    <StyledLink hasENS={!!ENSName} isENS={false} href={getEtherscanLink(chainId, account, 'address')}>
                      {account} ↗{' '}
                    </StyledLink>
                    <Copy toCopy={account}/>
                  </AccountControl>
                )}
              </AccountGroupingRow>
            </InfoCard>
          </YourAccount>

          {!(isMobile && ((window as any).web3 || (window as any).ethereum)) && (
            <ConnectButtonRow>
              <ButtonEmpty
                style={{ fontWeight: '400' }}
                padding={'px 12px'}
                width={260}
                onClick={() => {
                  openOptions()
                }}
              >
                Connect to a different wallet
              </ButtonEmpty>
            </ConnectButtonRow>
          )}
        </AccountSection>
      </UpperSection>
      {!!pendingTransactions.length || !!confirmedTransactions.length ? (
        <LowerSection>
          <TYPE.body>Recent Transactions</TYPE.body>
          {renderTransactions(pendingTransactions, true)}
          {renderTransactions(confirmedTransactions, false)}
        </LowerSection>
      ) : (
        <LowerSection>
          <TYPE.body color={theme.text1}>Your transactions will appear here...</TYPE.body>
        </LowerSection>
      )}
    </>
  )
}
