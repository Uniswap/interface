import { AbstractConnector } from '@web3-react/abstract-connector'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import React, { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import styled from 'styled-components'
import MetamaskIcon from '../../assets/images/metamask.png'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import { injected } from '../../connectors'
import { SUPPORTED_WALLETS } from '../../constants'
import usePrevious from '../../hooks/usePrevious'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useWalletModalToggle } from '../../state/application/hooks'
import { TYPE } from '../../theme'
import AccountDetails from '../AccountDetails'

import Modal from '../Modal'
import Option from './Option'
import PendingView from './PendingView'
import DxDao from '../../assets/svg/dxdao.svg'
import { AutoRow } from '../Row'
import { AlertTriangle } from 'react-feather'

const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 14px;
  cursor: pointer;
`

const CloseColor = styled(Close)`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.text3};
`

const StyledWarningIcon = styled(AlertTriangle)`
  stroke: ${({ theme }) => theme.text3};
`

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
`

const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 1rem 1.125rem 0 1.125rem;
  font-weight: 500;
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.primary1 : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const ContentWrapper = styled.div`
  padding: 16px 18px 32px 16px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 1rem`};
`

const UpperSection = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.bg1And2};

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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.bg1};
  height: 76px;
  position: relative;
  overflow: hidden;

  img {
    position: absolute;
    width: 80%;
  }
`

const OptionGrid = styled.div`
  display: grid;
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
  OPTIONS_SECONDARY: 'options_secondary',
  ACCOUNT: 'account',
  PENDING: 'pending'
}

export default function WalletModal({
  pendingTransactions,
  confirmedTransactions,
  ENSName
}: {
  pendingTransactions: string[] // hashes of pending
  confirmedTransactions: string[] // hashes of confirmed
  ENSName?: string
}) {
  // important that these are destructed from the account-specific web3-react context
  const { active, account, connector, activate, error } = useWeb3React()

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)

  const [pendingWallet, setPendingWallet] = useState<AbstractConnector | undefined>()

  const [pendingError, setPendingError] = useState<boolean>()

  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useWalletModalToggle()

  const previousAccount = usePrevious(account)

  // close on connection, when logged out before
  useEffect(() => {
    if (account && !previousAccount && walletModalOpen) {
      toggleWalletModal()
    }
  }, [account, previousAccount, toggleWalletModal, walletModalOpen])

  // always reset to account view
  useEffect(() => {
    if (walletModalOpen) {
      setPendingError(false)
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [walletModalOpen])

  // close modal when a connection is successful
  const activePrevious = usePrevious(active)
  const connectorPrevious = usePrevious(connector)
  useEffect(() => {
    if (walletModalOpen && ((active && !activePrevious) || (connector && connector !== connectorPrevious && !error))) {
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [setWalletView, active, error, connector, walletModalOpen, activePrevious, connectorPrevious])

  const tryActivation = async (connector: AbstractConnector | undefined) => {
    setPendingWallet(connector) // set wallet for pending view
    setWalletView(WALLET_VIEWS.PENDING)

    // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
    if (connector instanceof WalletConnectConnector && connector.walletConnectProvider?.wc?.uri) {
      connector.walletConnectProvider = undefined
    }

    connector &&
      activate(connector, undefined, true).catch(error => {
        if (error instanceof UnsupportedChainIdError) {
          activate(connector) // a little janky...can't use setError because the connector isn't set
        } else {
          setPendingError(true)
        }
      })
  }

  // get wallets user can switch too, depending on device/browser
  function getOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask
    return Object.keys(SUPPORTED_WALLETS).map(key => {
      const option = SUPPORTED_WALLETS[key]
      // check for mobile options
      if (isMobile) {
        if (!window.web3 && !window.ethereum && option.mobile) {
          return (
            <Option
              onClick={() => {
                option.connector !== connector && !option.href && tryActivation(option.connector)
              }}
              id={`connect-${key}`}
              key={key}
              active={option.connector && option.connector === connector}
              color={option.color}
              link={option.href}
              header={option.name}
              subheader={null}
              icon={require('../../assets/images/' + option.iconName)}
            />
          )
        }
        return null
      }

      // overwrite injected when needed
      if (option.connector === injected) {
        // don't show injected if there's no injected provider
        if (!(window.web3 || window.ethereum)) {
          if (option.name === 'MetaMask') {
            return (
              <Option
                id={`connect-${key}`}
                key={key}
                color={'#E8831D'}
                header={'Install Metamask'}
                subheader={null}
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

      // return rest of options
      return (
        !isMobile &&
        !option.mobileOnly && (
          <Option
            id={`connect-${key}`}
            onClick={() => {
              option.connector === connector
                ? setWalletView(WALLET_VIEWS.ACCOUNT)
                : !option.href && tryActivation(option.connector)
            }}
            key={key}
            active={option.connector === connector}
            color={option.color}
            link={option.href}
            header={option.name}
            subheader={null} //use option.descriptio to bring back multi-line
            icon={require('../../assets/images/' + option.iconName)}
          />
        )
      )
    })
  }

  function getModalContent() {
    if (error) {
      return (
        <UpperSection>
          <CloseIcon onClick={toggleWalletModal}>
            <CloseColor />
          </CloseIcon>
          <HeaderRow>
            <AutoRow gap="6px">
              <StyledWarningIcon size="20px" />
              <TYPE.main fontSize="16px" lineHeight="22px" color={'text3'}>
                {error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error connecting'}
              </TYPE.main>
            </AutoRow>
          </HeaderRow>
          <ContentWrapper>
            <TYPE.yellow color="text4">
              <h5>
                {error instanceof UnsupportedChainIdError
                  ? 'Please connect to the appropriate network.'
                  : 'Error connecting. Try refreshing the page.'}
              </h5>
            </TYPE.yellow>
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
          <CloseColor />
        </CloseIcon>
        {walletView !== WALLET_VIEWS.ACCOUNT ? (
          <HeaderRow color="blue">
            <HoverText
              onClick={() => {
                setPendingError(false)
                setWalletView(WALLET_VIEWS.ACCOUNT)
              }}
            >
              <TYPE.body color="text4" fontWeight={500} fontSize="20px" lineHeight="24px" letterSpacing="-0.01em">
                Back
              </TYPE.body>
            </HoverText>
          </HeaderRow>
        ) : (
          <HeaderRow>
            <TYPE.body fontWeight={500} fontSize={20} color="text4">
              Connect to a wallet
            </TYPE.body>
          </HeaderRow>
        )}
        <ContentWrapper>
          {walletView === WALLET_VIEWS.PENDING ? (
            <PendingView
              connector={pendingWallet}
              error={pendingError}
              setPendingError={setPendingError}
              tryActivation={tryActivation}
            />
          ) : (
            <OptionGrid>{getOptions()}</OptionGrid>
          )}
        </ContentWrapper>
        <Blurb as="a" href="https://dxdao.eth.link/" rel="noopener noreferrer" target="_blank">
          <TYPE.body fontWeight={700} fontSize="10px" color="text1" letterSpacing="3px" marginBottom="8px">
            A DXDAO PRODUCT
          </TYPE.body>
          <TYPE.body fontWeight={600} fontSize="8px" color="text5" letterSpacing="2px">
            DXDAO.ETH
          </TYPE.body>
          <img src={DxDao} alt="dxdao" />
        </Blurb>
      </UpperSection>
    )
  }

  return (
    <Modal isOpen={walletModalOpen} onDismiss={toggleWalletModal} minHeight={false} maxHeight={90}>
      <Wrapper>{getModalContent()}</Wrapper>
    </Modal>
  )
}
