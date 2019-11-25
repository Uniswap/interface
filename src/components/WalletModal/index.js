import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { isMobile } from 'react-device-detect'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import { URI_AVAILABLE } from '@web3-react/walletconnect-connector'

import Modal from '../Modal'
import AccountDetails from '../AccountDetails'
import QrCode from './QrCode'
import Option from './Option'
import { SUPPORTED_WALLETS, MOBILE_DEEP_LINKS } from '../../constants'
import { usePrevious } from '../../hooks'
import { Link } from '../../theme'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import MetamaskIcon from '../../assets/images/metamask.png'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import { injected, walletconnect } from '../../connectors'
import { useWalletModalToggle, useWalletModalOpen } from '../../contexts/Application'

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

const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 1.5rem 1.5rem;
  font-weight: 500;
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.royalBlue : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const ContentWrapper = styled.div`
  background-color: ${({ theme }) => theme.backgroundColor};
  padding: 2rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 1rem`};
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

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
  `};
`

const HoverText = styled.div`
  :hover {
    cursor: pointer;
  }
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  ACCOUNT: 'account',
  WALLET_CONNECT: 'walletConnect'
}

export default function WalletModal({ pendingTransactions, confirmedTransactions, ENSName }) {
  const { active, account, connector, activate, error } = useWeb3React()

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
    if (walletModalOpen && ((active && !activePrevious) || (connector && connector !== connectorPrevious && !error))) {
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [setWalletView, active, error, connector, walletModalOpen, activePrevious, connectorPrevious])

  // get wallets user can switch too, depending on device/browser
  function getOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask

    if (isMobile && !window.web3 && !window.ethereum) {
      return Object.keys(MOBILE_DEEP_LINKS).map(key => {
        const option = MOBILE_DEEP_LINKS[key]
        return (
          <Option
            key={key}
            color={option.color}
            header={option.name}
            link={option.href}
            subheader={option.description}
            icon={require('../../assets/images/' + option.iconName)}
          />
        )
      })
    } else {
      return Object.keys(SUPPORTED_WALLETS).map(key => {
        const option = SUPPORTED_WALLETS[key]

        // don't show the option we're currently connected to
        if (option.connector === connector) {
          return null
        }

        if (option.connector === injected) {
          // don't show injected if there's no injected provider
          if (!(window.web3 || window.ethereum)) {
            if (option.name === 'MetaMask') {
              return (
                <Option
                  key={key}
                  color={'#E8831D'}
                  header={'Install Metamask'}
                  subheader={'Easy to use browser extension.'}
                  link={'https://metamask.io/'}
                  icon={MetamaskIcon}
                />
              )
            } else {
              return null //dont want to return install twice
            }
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
          <Option
            onClick={() => {
              activate(option.connector)
            }}
            key={key}
            color={option.color}
            header={option.name}
            subheader={walletView === WALLET_VIEWS.OPTIONS ? null : option.description}
            icon={require('../../assets/images/' + option.iconName)}
          />
        )
      })
    }
  }

  function getModalContent() {
    if (error) {
      return (
        <UpperSection>
          <CloseIcon onClick={toggleWalletModal}>
            <CloseColor alt={'close icon'} />
          </CloseIcon>
          <HeaderRow>{error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error connecting'}</HeaderRow>
          <ContentWrapper>
            {error instanceof UnsupportedChainIdError ? (
              <h5>Please connect to the main Ethereum network.</h5>
            ) : (
              'Error connecting. Try refreshing the page.'
            )}
          </ContentWrapper>
        </UpperSection>
      )
    }
    if (account && walletView === WALLET_VIEWS.ACCOUNT) {
      return (
        <AccountDetails
          toggleWalletModal={toggleWalletModal}
          pendingTransactions={pendingTransactions}
          confirmedTransactions={confirmedTransactions}
          ENSName={ENSName}
          openOptions={() => setWalletView(WALLET_VIEWS.OPTIONS)}
        />
      )
    }
    return (
      <UpperSection>
        <CloseIcon onClick={toggleWalletModal}>
          <CloseColor alt={'close icon'} />
        </CloseIcon>
        {walletView !== WALLET_VIEWS.ACCOUNT ? (
          <HeaderRow
            color="blue"
            onClick={() => {
              setWalletView(WALLET_VIEWS.ACCOUNT)
            }}
          >
            <HoverText>Back</HoverText>
          </HeaderRow>
        ) : (
          <HeaderRow>
            <HoverText>Connect To A Wallet</HoverText>
          </HeaderRow>
        )}
        <ContentWrapper>
          {walletView === WALLET_VIEWS.WALLET_CONNECT ? (
            <QrCode
              uri={uri}
              header={'Connect with Wallet Connect'}
              subheader={'Open protocol supported by major mobile wallets'}
              size={220}
              icon={WalletConnectIcon}
            />
          ) : !account ? (
            getOptions()
          ) : (
            <OptionGrid>{getOptions()}</OptionGrid>
          )}
          <Blurb>
            <span>New to Ethereum? &nbsp;</span>{' '}
            <Link href="https://ethereum.org/use/#3-what-is-a-wallet-and-which-one-should-i-use">
              Learn more about wallets
            </Link>
          </Blurb>
        </ContentWrapper>
      </UpperSection>
    )
  }

  return (
    <Modal
      style={{ userSelect: 'none' }}
      isOpen={walletModalOpen}
      onDismiss={toggleWalletModal}
      minHeight={null}
      maxHeight={90}
    >
      <Wrapper>{getModalContent()}</Wrapper>
    </Modal>
  )
}
