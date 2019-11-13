import React, { useState, useEffect } from 'react'
import styled, { css } from 'styled-components'
import { useWeb3Context } from 'web3-react'

import { isMobile } from 'react-device-detect'
import QRCode from 'qrcode.react'

import Transaction from './Transaction'
import Copy from './Copy'
import Modal from '../Modal'

import { getEtherscanLink } from '../../utils'
import { Link } from '../../theme'
import { SUPPORTED_WALLETS } from '../../constants'

import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import MetamaskIcon from '../../assets/images/metamask.png'
import { ReactComponent as Close } from '../../assets/images/x.svg'

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
  margin: 0;
  padding: 0;
  width: 100%;
  background-color: ${({ theme }) => theme.backgroundColor};
  ${({ theme }) => theme.flexColumnNoWrap}
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
  padding: 1.5rem 2rem;
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

const QRSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  h5 {
    padding-bottom: 1rem;
  }
`

const CodeWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 280px;
  height: 280px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.placeholderGray};
`

const AccountSection = styled.div`
  background-color: ${({ theme }) => theme.concreteGray}
  padding: 0rem 2rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 0rem 1rem 1rem 1rem;`};
`

const InfoCard = styled.div`
  background-color: ${({ theme }) => theme.backgroundColor};
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.placeholderGray};
  border-radius: 20px;
  box-shadow: 0px 2px 10px rgba(47, 128, 237, 0.1);
`

const AccountGroupingRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: ${({ theme }) => theme.royalBlue};

  div {
    ${({ theme }) => theme.flexRowNoWrap}
    align-items: center;
  }

  &:first-of-type {
    margin-bottom: 20px;
  }
`

const OptionsSection = styled.div`
  background-color: ${({ theme }) => theme.backgroundColor}
  padding: 2rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 1rem`};
`

const OptionCard = styled(InfoCard)`
  display: grid;
  grid-template-columns: 1fr 80px;
  height: 50px;
  margin-top: 2rem;
  padding: 1rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    height: 40px;
    grid-template-columns: 1fr 40px;
    padding: 0.6rem 1rem;
  `};
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
  color: ${({ theme }) => theme.textColor}
  font-size: 12px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 10px;
  `};
`

const OptionCardLeft = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  height: 100%;
  justify-content: space-between;
`

const IconWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > * {
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
    background-color: green;
    border-radius: 50%;
  }
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
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  min-width: 0;
  
  ${({ hasENS, isENS }) =>
    hasENS &&
    isENS &&
    css`
      margin-bottom: 0.75rem;
    `}
  font-weight: ${({ hasENS, isENS }) => (hasENS ? (isENS ? css`500` : css`400`) : css`500`)};
  font-size: ${({ hasENS, isENS }) => (hasENS ? (isENS ? css`1rem` : css`0.8rem`) : css`1rem`)};

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

  &:hover {
    cursor: pointer;
    color: purple;
  }
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

const TransactionListWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap} /* margin: 0 0 1rem 0; */
`

const StyledLink = styled(Link)`
  color: ${({ hasENS, isENS, theme }) => (hasENS ? (isENS ? theme.royalBlue : theme.doveGray) : theme.royalBlue)};
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  ACCOUNT: 'account',
  WALLET_CONNECT: 'walletConnect'
}

export default function WalletModal({
  isOpen,
  error,
  onDismiss,
  openWalletModal,
  pendingTransactions,
  confirmedTransactions,
  ENSName
}) {
  const { account, networkId, setConnector, setError, connectorName, connector } = useWeb3Context()

  const { web3, ethereum } = window

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)

  const [uri, setUri] = useState()

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
      if (SUPPORTED_WALLETS[key].id === connectorName) {
        if (SUPPORTED_WALLETS[key].name === 'Injected' && ethereum.isMetaMask) {
          name = 'Metamask'
        } else {
          name = SUPPORTED_WALLETS[key].name
        }
      }
      return true
    })
    return name
  }

  function wrappedOnDismiss() {
    onDismiss()
  }

  //overwrite with Metamask styles
  useEffect(() => {
    if (ethereum && ethereum.isMetaMask) {
      SUPPORTED_WALLETS.INJECTED.name = 'MetaMask'
      SUPPORTED_WALLETS.INJECTED.iconName = 'metamask.png'
      SUPPORTED_WALLETS.INJECTED.description = 'Easy to use browser extension.'
      SUPPORTED_WALLETS.INJECTED.color = '#E8831D'
    }
  }, [ethereum])

  // always reset to account view
  useEffect(() => {
    setWalletView(WALLET_VIEWS.ACCOUNT)
  }, [isOpen])

  // after setting new connector, updates views
  useEffect(() => {
    if (connectorName === 'WalletConnect') {
      setUri(connector.walletConnector.uri)
      if (!account) {
        setWalletView(WALLET_VIEWS.WALLET_CONNECT)
        connector.walletConnector.on('connect', error => {
          if (error) {
            setError(error)
          } else {
            setWalletView(WALLET_VIEWS.ACCOUNT)
          }
        })
      } else {
        setWalletView(WALLET_VIEWS.ACCOUNT)
      }
    } else {
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [connector, connectorName, setError, account])

  function tryConnection(newWalletName) {
    if (connectorName !== newWalletName) {
      setConnector(newWalletName, { suppressAndThrowErrors: true }).catch(error => {
        wrappedOnDismiss()
      })
    } else {
      // tried wallet connect before but didn't scan yet
      if (connectorName === 'WalletConnect' && !account) {
        setWalletView(WALLET_VIEWS.WALLET_CONNECT)
      }
    }
  }

  function getWalletOptions() {
    return Object.keys(SUPPORTED_WALLETS).map(key => {
      const option = SUPPORTED_WALLETS[key]
      return (
        connectorName !== option.id &&
        !option.mobileOnly &&
        (option.id !== 'Injected' || (option.id === 'Injected' && (web3 || ethereum))) && (
          <WalletOption
            key={key}
            color={option.color}
            onClick={() => {
              if (option.id !== 'WalletConnect') {
                setWalletView(WALLET_VIEWS.ACCOUNT)
              }
              tryConnection(option.id)
            }}
          >
            {option.name === 'Injected' && ethereum && ethereum.isMetaMask ? 'MetaMask' : option.name}
            <IconWrapper size={24}>
              <img src={require('../../assets/images/' + option.iconName)} alt={'Icon'} />
            </IconWrapper>
          </WalletOption>
        )
      )
    })
  }

  function getMobileWalletOptions() {
    return Object.keys(SUPPORTED_WALLETS).map(key => {
      const option = SUPPORTED_WALLETS[key]
      return isMobile && !web3 && !ethereum && option.mobileOnly ? (
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
      ) : (
        ''
      )
    })
  }

  const UpperSectionCloseable = props => {
    return (
      <UpperSection>
        <CloseIcon onClick={() => wrappedOnDismiss()}>
          <CloseColor alt={'close icon'} />
        </CloseIcon>
        {props.children}
      </UpperSection>
    )
  }

  function getWalletDisplay() {
    if (isMobile && (!web3 && !ethereum)) {
      return (
        <UpperSectionCloseable>
          <HeaderRow>Connect To A Wallet</HeaderRow>
          <OptionsSection>
            {getMobileWalletOptions()}
            <Blurb>
              <span>New to Ethereum? &nbsp;</span> <Link>Learn more about wallets</Link>
            </Blurb>
          </OptionsSection>
        </UpperSectionCloseable>
      )
    } else if (error) {
      return (
        <>
          <UpperSectionCloseable>
            <HeaderRow>Wrong Network</HeaderRow>
            <OptionsSection>
              <h5>Please connect to the main Ethereum network.</h5>
            </OptionsSection>
          </UpperSectionCloseable>
        </>
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
            Back
          </HeaderRow>
          <OptionsSection>
            <QRSection>
              <h5>Scan QR code with a compatible wallet</h5>
              <CodeWrapper>{uri && <QRCode size={220} value={uri} />}</CodeWrapper>
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
                  {ENSName && (
                    <AccountControl hasENS={!!ENSName} isENS={true}>
                      <StyledLink
                        hasENS={!!ENSName}
                        isENS={true}
                        href={getEtherscanLink(networkId, ENSName, 'address')}
                      >
                        {ENSName} ↗{' '}
                      </StyledLink>

                      <Copy toCopy={ENSName} />
                    </AccountControl>
                  )}
                  <AccountGroupingRow>
                    {formatConnectorName()}
                    <div>
                      Connected
                      <GreenCircle>
                        <div />
                      </GreenCircle>
                    </div>
                  </AccountGroupingRow>
                  <AccountGroupingRow>
                    <AccountControl hasENS={!!ENSName} isENS={false}>
                      <StyledLink
                        hasENS={!!ENSName}
                        isENS={false}
                        href={getEtherscanLink(networkId, account, 'address')}
                      >
                        {account} ↗{' '}
                      </StyledLink>
                      <Copy toCopy={account} />
                    </AccountControl>
                  </AccountGroupingRow>
                </InfoCard>
              </YourAccount>
              {isMobile ? (
                ''
              ) : (
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
            <WalletGrid>{getWalletOptions()}</WalletGrid>
            <Blurb>
              <span>New to Ethereum? &nbsp;</span> <Link>Learn more about wallets</Link>
            </Blurb>
          </OptionsSection>
        </UpperSectionCloseable>
      )
    } else {
      return (
        <UpperSectionCloseable>
          <HeaderRow>Connect To A Wallet</HeaderRow>
          <OptionsSection>
            {web3 || ethereum ? (
              <OptionCardClickable onClick={() => tryConnection('Injected')}>
                <OptionCardLeft>
                  <HeaderText color={SUPPORTED_WALLETS.INJECTED.color}>{SUPPORTED_WALLETS.INJECTED.name}</HeaderText>
                  <SubHeader>{SUPPORTED_WALLETS.INJECTED.description}</SubHeader>
                </OptionCardLeft>
                <IconWrapper>
                  {<img src={require('../../assets/images/' + SUPPORTED_WALLETS.INJECTED.iconName)} alt={'Icon'} />}
                </IconWrapper>
              </OptionCardClickable>
            ) : (
              <OptionCardClickable>
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
            )}
            <OptionCardClickable
              onClick={() => {
                tryConnection('WalletConnect')
              }}
            >
              <OptionCardLeft>
                <HeaderText color="blue">Connect Using WalletConnect</HeaderText>
                <SubHeader>Connect to Trust Wallet, Rainbow Wallet and more...</SubHeader>
              </OptionCardLeft>
              <IconWrapper>
                <img src={WalletConnectIcon} alt={'Icon'} />
              </IconWrapper>
            </OptionCardClickable>
            <OptionCardClickable
              onClick={() => {
                tryConnection('WalletLink')
              }}
            >
              <OptionCardLeft>
                <HeaderText color="blue">Connect Using Coinbase Wallet</HeaderText>
                <SubHeader>Use Coinbase Wallet app on mobile device</SubHeader>
              </OptionCardLeft>
              <IconWrapper>
                <img src={CoinbaseWalletIcon} alt={'Icon'} />
              </IconWrapper>
            </OptionCardClickable>
            <Blurb>
              <span>New to Ethereum? &nbsp;</span> <Link>Learn more about wallets</Link>
            </Blurb>
          </OptionsSection>
        </UpperSectionCloseable>
      )
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} minHeight={null} maxHeight={90}>
      <Wrapper>{getWalletDisplay()}</Wrapper>
    </Modal>
  )
}
