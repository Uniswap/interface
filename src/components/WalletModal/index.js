import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { isMobile } from 'react-device-detect'
import QRCode from 'qrcode.react'
import { transparentize } from 'polished'
import { useWeb3React } from '@web3-react/core'
import { URI_AVAILABLE } from '@web3-react/walletconnect-connector'

import Transaction from './Transaction'
import Copy from './Copy'
import Modal from '../Modal'

import { SUPPORTED_WALLETS, MOBILE_DEEP_LINKS } from '../../constants'
import { getEtherscanLink } from '../../utils'
import { usePrevious } from '../../hooks'
import { Link } from '../../theme'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import MetamaskIcon from '../../assets/images/metamask.png'
import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'

import { ReactComponent as Close } from '../../assets/images/x.svg'
import { useDarkModeManager } from '../../contexts/LocalStorage'
import { injected, walletconnect, walletlink } from '../../connectors'
import { useWalletModalToggle, useWalletModalOpen } from '../../contexts/Application'
import Identicon from '../Identicon'

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
    stroke: ${({ theme }) => theme.chaliceGray};
  }
`

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
  background-color: ${({ theme }) => theme.backgroundColor};
`

const OptionButton = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.royalBlue};
  color: ${({ theme }) => theme.royalBlue};
  padding: 8px 24px;

  &:hover {
    border: 1px solid ${({ theme }) => theme.malibuBlue};
    cursor: pointer;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 12px;
  `};
`

const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 1.5rem 1.5rem;
  font-weight: 500;
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.royalBlue : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const UpperSection = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.concreteGray};

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

const WalletGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
  `};
`

const WalletOption = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.placeholderGray};
  border-radius: 12px;
  font-weight: 500;
  color: ${props => props.color};
  user-select: none;

  & > * {
    user-select: none;
  }

  &:hover {
    border: 1px solid ${({ theme }) => theme.malibuBlue};
    cursor: pointer;
  }
`

const WalletName = styled.div`
  padding-left: 0.5rem;
  width: initial;
`

const QRSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  h5 {
    padding-bottom: 1rem;
  }
`

const QRCodeWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 280px;
  height: 280px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.placeholderGray};
`

const AccountSection = styled.div`
  background-color: ${({ theme }) => theme.concreteGray};
  padding: 0rem 1.5rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 0rem 1rem 1rem 1rem;`};
`

const InfoCard = styled.div`
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.placeholderGray};
  border-radius: 20px;
`

const AccountGroupingRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: ${({ theme }) => theme.textColor};

  div {
    ${({ theme }) => theme.flexRowNoWrap}
    align-items: center;
  }

  &:first-of-type {
    margin-bottom: 20px;
  }
`

const OptionsSection = styled.div`
  background-color: ${({ theme }) => theme.backgroundColor};
  padding: 2rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 1rem`};
`

const OptionCard = styled(InfoCard)`
  display: grid;
  grid-template-columns: 1fr 48px;
  height: 50px;
  margin-top: 2rem;
  padding: 1rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    height: 40px;
    grid-template-columns: 1fr 40px;
    padding: 0.6rem 1rem;
  `};
`

const OptionCardLeft = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  height: 100%;
  justify-content: space-between;
`

const OptionCardClickable = styled(OptionCard)`
  margin-top: 0;
  margin-bottom: 1rem;
  &:hover {
    cursor: pointer;
    border: 1px solid ${({ theme }) => theme.malibuBlue};
  }
`

const HeaderText = styled.div`
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.royalBlue : props.color)};
  font-size: 1rem;
  font-weight: 500;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 12px;
  `};
`

const SubHeader = styled.div`
  color: ${({ theme }) => theme.textColor};
  font-size: 12px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 10px;
  `};
`

const IconWrapper = styled.div`
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
    margin-top: -6px;
    background-color: ${({ theme }) => theme.connectedGreen};
    border-radius: 50%;
  }
`

const GreenText = styled.div`
  color: ${({ theme }) => theme.connectedGreen};
`

const LowerSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  padding: 2rem;
  flex-grow: 1;
  overflow: auto;

  h5 {
    margin: 0;
    font-weight: 400;
    color: ${({ theme }) => theme.doveGray};
  }
`

const AccountControl = styled.div`
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
  margin: 30px;
`

const Blurb = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin: 1rem;
    font-size: 12px;
  `};
`

const HoverText = styled.div`
  :hover {
    cursor: pointer;
  }
`

const TransactionListWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
`

const StyledLink = styled(Link)`
  color: ${({ hasENS, isENS, theme }) => (hasENS ? (isENS ? theme.royalBlue : theme.doveGray) : theme.royalBlue)};
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  ACCOUNT: 'account',
  WALLET_CONNECT: 'walletConnect'
}

export default function WalletModal({ pendingTransactions, confirmedTransactions, ENSName }) {
  const [isDark] = useDarkModeManager()
  const { active, chainId, account, connector, activate, error } = useWeb3React()

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)

  const walletModalOpen = useWalletModalOpen()
  const toggleWalletModal = useWalletModalToggle()

  // always reset to account view
  useEffect(() => {
    if (walletModalOpen) {
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [walletModalOpen])

  // set up uri listener for walletconnect
  const [uri, setUri] = useState()
  useEffect(() => {
    const activateWC = uri => {
      setUri(uri)
      setWalletView(WALLET_VIEWS.WALLET_CONNECT)
    }
    walletconnect.on(URI_AVAILABLE, activateWC)
    return () => {
      walletconnect.off(URI_AVAILABLE, activateWC)
    }
  }, [])

  // close modal when a connection is successful
  const activePrevious = usePrevious(active)
  const connectorPrevious = usePrevious(connector)
  useEffect(() => {
    if (walletModalOpen && ((active && !activePrevious) || (connector && connector !== connectorPrevious))) {
      toggleWalletModal()
    }
  })

  function getStatusIcon() {
    if (connector === injected) {
      return (
        <IconWrapper size={16}>
          <Identicon /> {formatConnectorName()}
        </IconWrapper>
      )
    } else if (connector === walletconnect) {
      return (
        <IconWrapper size={16}>
          <img src={WalletConnectIcon} alt={''} /> {formatConnectorName()}
        </IconWrapper>
      )
    } else if (connector === walletlink) {
      return (
        <IconWrapper size={16}>
          <img src={CoinbaseWalletIcon} alt={''} /> {formatConnectorName()}
        </IconWrapper>
      )
    }
  }

  function renderTransactions(transactions, pending) {
    return (
      <TransactionListWrapper>
        {transactions.map((hash, i) => {
          return <Transaction key={i} hash={hash} pending={pending} />
        })}
      </TransactionListWrapper>
    )
  }

  function formatConnectorName() {
    let name = ''
    Object.keys(SUPPORTED_WALLETS).map(key => {
      if (SUPPORTED_WALLETS[key].connector === connector) {
        name = SUPPORTED_WALLETS[key].name
      }
      return true
    })
    return <WalletName>{name}</WalletName>
  }

  // get wallets user can switch too, depending on device/browser
  function getAdditionalOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask

    return Object.keys(SUPPORTED_WALLETS).map(key => {
      const option = SUPPORTED_WALLETS[key]

      // don't show the option we're currently connected to
      if (option.connector === connector) {
        return null
      }

      if (option.connector === injected) {
        // don't show injected if there's no injected provider
        if (!(window.web3 || window.ethereum)) {
          return null
        }
        // don't return metamask if injected provider isn't metamask
        else if (option.name === 'MetaMask' && !isMetamask) {
          return null
        }
        // likewise for generic
        else if (option.name === 'Injected' && isMetamask) {
          return null
        }
      }

      return (
        <WalletOption
          key={option.name}
          color={option.color}
          onClick={() => {
            activate(option.connector)
          }}
        >
          {option.name}
          <IconWrapper size={24}>
            <img src={require('../../assets/images/' + option.iconName)} alt={'Icon'} />
          </IconWrapper>
        </WalletOption>
      )
    })
  }

  // only deep links (until other types are supported)
  function getMobileWalletOptions() {
    return Object.keys(MOBILE_DEEP_LINKS).map(key => {
      const option = MOBILE_DEEP_LINKS[key]
      return (
        <Link href={option.href}>
          <OptionCardClickable>
            <OptionCardLeft>
              <HeaderText color={option.color}>{option.name}</HeaderText>
              <SubHeader>{option.description}</SubHeader>
            </OptionCardLeft>
            <IconWrapper size={20}>
              <img src={require('../../assets/images/' + option.iconName)} alt={'Icon'} />
            </IconWrapper>
          </OptionCardClickable>
        </Link>
      )
    })
  }

  // get options when user is logged out
  function getLoggedOutOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask

    return Object.keys(SUPPORTED_WALLETS).map(key => {
      const option = SUPPORTED_WALLETS[key]

      if (option.connector === injected) {
        // show install if no metamask
        if (!(window.web3 || window.ethereum)) {
          return (
            <OptionCardClickable key={key}>
              <OptionCardLeft>
                <HeaderText color={'#E8831D'}>Install Metamask</HeaderText>
                <SubHeader>
                  Easy to use browser extension.
                  <Link href={'https://metamask.io/'}> Download.</Link>
                </SubHeader>
              </OptionCardLeft>
              <IconWrapper>
                <img src={MetamaskIcon} alt={'Icon'} />
              </IconWrapper>
            </OptionCardClickable>
          )
        }
        // don't return metamask if injected provider isn't metamask
        else if (option.name === 'MetaMask' && !isMetamask) {
          return null
        }
        // likewise for generic
        else if (option.name === 'Injected' && isMetamask) {
          return null
        }
      }

      return (
        <OptionCardClickable
          onClick={() => {
            activate(option.connector)
          }}
          key={key}
        >
          <OptionCardLeft>
            <HeaderText color={option.color}>{option.name}</HeaderText>
            <SubHeader>{option.description}</SubHeader>
          </OptionCardLeft>
          <IconWrapper>
            <img src={require('../../assets/images/' + option.iconName)} alt={'Icon'} />
          </IconWrapper>
        </OptionCardClickable>
      )
    })
  }

  const UpperSectionCloseable = props => {
    return (
      <UpperSection>
        <CloseIcon onClick={toggleWalletModal}>
          <CloseColor alt={'close icon'} />
        </CloseIcon>
        {props.children}
      </UpperSection>
    )
  }

  function getWalletDisplay() {
    if (isMobile && !window.web3 && !window.ethereum) {
      return (
        <UpperSectionCloseable>
          <HeaderRow>Connect To A Wallet</HeaderRow>
          <OptionsSection>
            {getMobileWalletOptions()}
            <Blurb>
              <span>New to Ethereum? &nbsp;</span>{' '}
              <Link href="https://ethereum.org/use/#3-what-is-a-wallet-and-which-one-should-i-use">
                Learn more about wallets
              </Link>
            </Blurb>
          </OptionsSection>
        </UpperSectionCloseable>
      )
    } else if (error) {
      return (
        <UpperSectionCloseable>
          <HeaderRow>Wrong Network</HeaderRow>
          <OptionsSection>
            <h5>Please connect to the main Ethereum network.</h5>
          </OptionsSection>
        </UpperSectionCloseable>
      )
    } else if (walletView === WALLET_VIEWS.WALLET_CONNECT) {
      return (
        <UpperSectionCloseable>
          <HeaderRow
            color="blue"
            onClick={() => {
              setWalletView(WALLET_VIEWS.ACCOUNT)
            }}
          >
            <HoverText>Back</HoverText>
          </HeaderRow>
          <OptionsSection>
            <QRSection>
              <h5>Scan QR code with a compatible wallet</h5>
              <QRCodeWrapper>
                {uri && (
                  <QRCode
                    size={220}
                    value={uri}
                    bgColor={isDark ? '#333639' : 'white'}
                    fgColor={isDark ? 'white' : 'black'}
                  />
                )}
              </QRCodeWrapper>
              <OptionCard>
                <OptionCardLeft>
                  <HeaderText color="4196FC">Connect with Wallet Connect</HeaderText>
                  <SubHeader>Open protocol supported by major mobile wallets</SubHeader>
                </OptionCardLeft>
                <IconWrapper>
                  <img src={WalletConnectIcon} alt={'Icon'} />
                </IconWrapper>
              </OptionCard>
            </QRSection>
          </OptionsSection>
        </UpperSectionCloseable>
      )
    } else if (account && walletView === WALLET_VIEWS.ACCOUNT) {
      return (
        <>
          <UpperSectionCloseable>
            <HeaderRow>Account</HeaderRow>
            <AccountSection>
              <YourAccount>
                <InfoCard>
                  <AccountGroupingRow>
                    {getStatusIcon()}
                    <GreenText>
                      <GreenCircle>
                        <div />
                      </GreenCircle>
                    </GreenText>
                  </AccountGroupingRow>
                  <AccountGroupingRow>
                    {ENSName ? (
                      <AccountControl hasENS={!!ENSName} isENS={true}>
                        <StyledLink
                          hasENS={!!ENSName}
                          isENS={true}
                          href={getEtherscanLink(chainId, ENSName, 'address')}
                        >
                          {ENSName} ↗{' '}
                        </StyledLink>
                        <Copy toCopy={ENSName} />
                      </AccountControl>
                    ) : (
                      <AccountControl hasENS={!!ENSName} isENS={false}>
                        <StyledLink
                          hasENS={!!ENSName}
                          isENS={false}
                          href={getEtherscanLink(chainId, account, 'address')}
                        >
                          {account} ↗{' '}
                        </StyledLink>
                        <Copy toCopy={account} />
                      </AccountControl>
                    )}
                  </AccountGroupingRow>
                </InfoCard>
              </YourAccount>
              {!isMobile && (
                <ConnectButtonRow>
                  <OptionButton
                    onClick={() => {
                      setWalletView(WALLET_VIEWS.OPTIONS)
                    }}
                  >
                    Connect to a different wallet
                  </OptionButton>
                </ConnectButtonRow>
              )}
            </AccountSection>
          </UpperSectionCloseable>
          {!!pendingTransactions.length || !!confirmedTransactions.length ? (
            <LowerSection>
              <h5>Recent Transactions</h5>
              {renderTransactions(pendingTransactions, true)}
              {renderTransactions(confirmedTransactions, false)}
            </LowerSection>
          ) : (
            <LowerSection>
              <h5>Your transactions will appear here...</h5>
            </LowerSection>
          )}
        </>
      )
    } else if (walletView === WALLET_VIEWS.OPTIONS) {
      return (
        <UpperSectionCloseable>
          <HeaderRow>Connect A Wallet</HeaderRow>
          <OptionsSection>
            <WalletGrid>{getAdditionalOptions()}</WalletGrid>
            <Blurb>
              <span>New to Ethereum? &nbsp;</span>{' '}
              <Link href="https://ethereum.org/use/#3-what-is-a-wallet-and-which-one-should-i-use">
                Learn more about wallets
              </Link>
            </Blurb>
          </OptionsSection>
        </UpperSectionCloseable>
      )
    } else {
      return (
        <UpperSectionCloseable>
          <HeaderRow>Connect To A Wallet</HeaderRow>
          <OptionsSection>
            {getLoggedOutOptions()}
            <Blurb>
              <span>New to Ethereum? &nbsp;</span>{' '}
              <Link href="https://ethereum.org/use/#3-what-is-a-wallet-and-which-one-should-i-use">
                Learn more about wallets
              </Link>
            </Blurb>
          </OptionsSection>
        </UpperSectionCloseable>
      )
    }
  }

  return (
    <Modal
      style={{ userSelect: 'none' }}
      isOpen={walletModalOpen}
      onDismiss={toggleWalletModal}
      minHeight={null}
      maxHeight={90}
    >
      <Wrapper>{getWalletDisplay()}</Wrapper>
    </Modal>
  )
}
