import { ExternalLink, TYPE } from '../../theme'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { fortmatic, injected, portis } from '../../connectors'
import { useEffect, useState } from 'react'
import { useModalOpen, useWalletModalToggle } from '../../state/application/hooks'

import { AbstractConnector } from '@web3-react/abstract-connector'
import AccountDetails from '../AccountDetails'
import { ApplicationModal } from '../../state/application/actions'
import { AutoRow } from 'components/Row'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import { LightCard } from '../Card'
import MetamaskIcon from '../../assets/images/metamask.png'
import Modal from '../Modal'
import { OVERLAY_READY } from '../../connectors/Fortmatic'
import Option from './Option'
import PendingView from './PendingView'
import QuestionHelper from 'components/QuestionHelper'
import ReactGA from 'react-ga'
import { SUPPORTED_WALLETS } from '../../constants/wallet'
import { Trans } from '@lingui/macro'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { flex } from 'styled-system'
import { isMobile } from 'react-device-detect'
import styled from 'styled-components/macro'
import usePrevious from '../../hooks/usePrevious'

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
color:${props => props.theme.text1};
  path {
    stroke: ${({ theme }) => theme.text1};
  }
`

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
  background: ${props => props.theme.bg0};
`

const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 20px 30px 10px 30px;
  font-weight: 600;
  font-family: 'Open Sans';
  color:${(props) => props.theme.text1};
  background:${props => props.theme.bg0};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const InternalHeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 5px;
  font-weight: 600;
  font-family: 'Open Sans';

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`


const ContentWrapper = styled.div`
  background: ${({ theme }) => theme.bg0};
  padding: 30px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 0 1rem 1rem 1rem`};
`

const UpperSection = styled.div`
  position: relative;

  h5 {
    margin: 0;
    margin-bottom: 0.25rem;
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

const OptionGrid = styled.div`
  padding: 20px 0px 0px 0px;
  display: grid;
  grid-gap: 10px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
  `};
`

const HoverText = styled.div`
  text-decoration: none;
  color: ${({ theme }) => theme.text1};
  display: flex;
  align-items: center;

  :hover {
    cursor: pointer;
  }
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  OPTIONS_SECONDARY: 'options_secondary',
  ACCOUNT: 'account',
  PENDING: 'pending',
}

export default function WalletModal({
  pendingTransactions,
  confirmedTransactions,
  ENSName,
}: {
  pendingTransactions: string[] // hashes of pending
  confirmedTransactions: string[] // hashes of confirmed
  ENSName?: string
}) {
  // important that these are destructed from the account-specific web3-react context
  const { active, account, connector, activate, error } = useWeb3React()

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)
  const previousWalletView = usePrevious(walletView)

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
    let name = ''
    Object.keys(SUPPORTED_WALLETS).map((key) => {
      if (connector === SUPPORTED_WALLETS[key].connector) {
        return (name = SUPPORTED_WALLETS[key].name)
      }
      return true
    })
    // log selected wallet
    ReactGA.event({
      category: 'Wallet',
      action: 'Change Wallet',
      label: name,
    })

    setPendingWallet(connector) // set wallet for pending view
    setWalletView(WALLET_VIEWS.PENDING)

    // if the connector is walletconnect and the user has already tried to connect, manually reset the connector

    console.dir(connector)
    if (connector instanceof WalletConnectConnector && connector.walletConnectProvider?.wc?.uri) {
      connector.walletConnectProvider = undefined
    }

    connector &&
      activate(connector, undefined, true).catch((error) => {
        if (error instanceof UnsupportedChainIdError) {
          activate(connector) // a little janky...can't use setError because the connector isn't set
        } else {
          setPendingError(true)
        }
      })
  }

  // close wallet modal if fortmatic modal is active
  useEffect(() => {
    fortmatic.on(OVERLAY_READY, () => {
      toggleWalletModal()
    })
  }, [toggleWalletModal])

  // get wallets user can switch too, depending on device/browser
  function getOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask
    return Object.keys(SUPPORTED_WALLETS).map((key) => {
      const option = SUPPORTED_WALLETS[key]
      // check for mobile options
      if (isMobile) {
        //disable portis on mobile for now
        if (option.connector === portis) {
          return null
        }

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
              icon={option.iconURL}
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
                header={<Trans>Install Metamask</Trans>}
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
            icon={option.iconURL}
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
            {error instanceof UnsupportedChainIdError ? <Trans>Wrong Network</Trans> : <Trans>Error connecting</Trans>}
          </HeaderRow>
          <ContentWrapper>
            {error instanceof UnsupportedChainIdError ? (
              <h5>
                <Trans>Please connect to the appropriate Ethereum network.</Trans>
              </h5>
            ) : (
              <Trans>Error connecting. Try refreshing the page.</Trans>
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
          <CloseColor />
        </CloseIcon>
        {walletView !== WALLET_VIEWS.ACCOUNT ? (
          <HeaderRow>
            <HoverText
              onClick={() => {
                setPendingError(false)
                setWalletView(WALLET_VIEWS.ACCOUNT)
              }}
            >
              <Trans>Back</Trans>
            </HoverText>
          </HeaderRow>
        ) : (
          <HeaderRow style={{ fontFamily: 'Open Sans', fontSize: 24, letterSpacing: 2 }}>

            <Trans>Connect to a wallet</Trans>

          </HeaderRow>
        )}

        <ContentWrapper>
          <LightCard style={{ marginBottom: '12px', fontFamily: 'Open Sans' }}>
            <InternalHeaderRow style={{ justifyContent: 'center', fontFamily: 'Open Sans', fontSize: 14, letterSpacing: 1 }}>
              <Trans>Switching networks &nbsp; <QuestionHelper size={18} text={" To use BSC select Smart Chain prior to connecting. If your wallet lets you change network on the fly (MetaMask does) then you can change at any time. If your wallet does not then disconnect and reconnect to switch networks."} /></Trans>
            </InternalHeaderRow>
            <AutoRow style={{ justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
              <TYPE.main textAlign="center" style={{ display: 'flex' }} fontSize={14}>
                <Trans>
                  <div style={{ width: '100%', justifyContent: 'center', flexFlow: 'row', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div>
                      The Network you are using is controlled by your wallet.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexFlow: 'row wrap' }}>

                      <ExternalLink href="https://kibainu.org/networkhelp/">Click here for help.</ExternalLink>
                    </div>
                  </div>
                </Trans>
              </TYPE.main>
            </AutoRow>
          </LightCard>
          <LightCard style={{ marginBottom: '12px', fontFamily: 'Open Sans', lineHeight: '22px', borderColor: '#18181E' }}>
            <AutoRow style={{ flexWrap: 'nowrap' }}>
              <TYPE.main fontSize={14}>
                <Trans>
                  By connecting a wallet, you agree to Uniswap Labs’ {' '}
                  <ExternalLink href="https://uniswap.org/terms-of-service/">Terms of Service</ExternalLink> and
                  acknowledge that you have read and understand the {' '}
                  <ExternalLink href="https://uniswap.org/disclaimer/">Uniswap protocol disclaimer.</ExternalLink>
                  <small style={{ fontSize: 14 }}>&nbsp;In addition, you are agreeing to using any Custom Contract implementations that may have been or will be put in place to enhance the performance of KibaSwap.</small>
                </Trans>
              </TYPE.main>
            </AutoRow>
          </LightCard>
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
      </UpperSection>
    )
  }

  return (
    <Modal isOpen={walletModalOpen} onDismiss={toggleWalletModal} minHeight={false} maxHeight={90}>
      <Wrapper>{getModalContent()}</Wrapper>
    </Modal>
  )
}
