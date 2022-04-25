import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ChainIdNotAllowedError } from '@web3-react/store'
import { Connector } from '@web3-react/types'
import { AutoColumn } from 'components/Column'
import { PrivacyPolicy } from 'components/PrivacyPolicy'
import Row, { AutoRow, RowBetween } from 'components/Row'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Info } from 'react-feather'
import styled from 'styled-components/macro'

import { ReactComponent as Close } from '../../assets/images/x.svg'
import usePrevious from '../../hooks/usePrevious'
import { useModalOpen, useWalletModalToggle } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { ExternalLink, ThemedText } from '../../theme'
import AccountDetails from '../AccountDetails'
import Card, { LightCard } from '../Card'
import Modal from '../Modal'
import CoinbaseWalletOption from './CoinbaseWalletOption'
import MetaMaskOption from './MetaMaskOption'
import WalletConnectOption from './WalletConnectOption'

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

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
`

const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 1rem 1rem;
  font-weight: 500;
  color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.primary1 : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const ContentWrapper = styled.div`
  background-color: ${({ theme }) => theme.bg0};
  padding: 0 1rem 1rem 1rem;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;

  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 0 1rem 1rem 1rem`};
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

const OptionGrid = styled.div`
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

const LinkCard = styled(Card)`
  background-color: ${({ theme }) => theme.bg1};
  color: ${({ theme }) => theme.text3};

  :hover {
    cursor: pointer;
    filter: brightness(0.9);
  }
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  OPTIONS_SECONDARY: 'options_secondary',
  ACCOUNT: 'account',
  PENDING: 'pending',
  LEGAL: 'legal',
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
  const { isActive, account, connector, error } = useWeb3React()

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)
  const previousWalletView = usePrevious(walletView)

  const [pendingWallet, setPendingWallet] = useState<Connector | undefined>()

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
  const isActivePrevious = usePrevious(isActive)
  const connectorPrevious = usePrevious(connector)
  useEffect(() => {
    if (
      walletModalOpen &&
      ((isActive && !isActivePrevious) || (connector && connector !== connectorPrevious && !error))
    ) {
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [setWalletView, isActive, error, connector, walletModalOpen, isActivePrevious, connectorPrevious])

  // // close wallet modal if fortmatic modal is active
  // useEffect(() => {
  //   fortmatic.on(OVERLAY_READY, () => {
  //     toggleWalletModal()
  //   })
  // }, [toggleWalletModal])

  // get wallets user can switch too, depending on device/browser
  function getOptions() {
    return (
      <>
        <CoinbaseWalletOption />
        <MetaMaskOption />
        <WalletConnectOption />
      </>
    )
  }

  function getModalContent() {
    if (error) {
      return (
        <UpperSection>
          <CloseIcon onClick={toggleWalletModal}>
            <CloseColor />
          </CloseIcon>
          <HeaderRow>
            {error instanceof ChainIdNotAllowedError ? <Trans>Wrong Network</Trans> : <Trans>Error connecting</Trans>}
          </HeaderRow>
          <ContentWrapper>
            {error instanceof ChainIdNotAllowedError ? (
              <h5>
                <Trans>Please connect to a supported network in the dropdown menu or in your wallet.</Trans>
              </h5>
            ) : (
              <Trans>Error connecting. Try refreshing the page.</Trans>
            )}
          </ContentWrapper>
        </UpperSection>
      )
    }
    if (walletView === WALLET_VIEWS.LEGAL) {
      return (
        <UpperSection>
          <HeaderRow>
            <HoverText
              onClick={() => {
                setWalletView(
                  (previousWalletView === WALLET_VIEWS.LEGAL ? WALLET_VIEWS.ACCOUNT : previousWalletView) ??
                    WALLET_VIEWS.ACCOUNT
                )
              }}
            >
              <ArrowLeft />
            </HoverText>
            <Row justify="center">
              <ThemedText.MediumHeader>
                <Trans>Legal & Privacy</Trans>
              </ThemedText.MediumHeader>
            </Row>
          </HeaderRow>
          <PrivacyPolicy />
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
              <ArrowLeft />
            </HoverText>
          </HeaderRow>
        ) : (
          <HeaderRow>
            <HoverText>
              <Trans>Connect a wallet</Trans>
            </HoverText>
          </HeaderRow>
        )}

        <ContentWrapper>
          <AutoColumn gap="16px">
            <LightCard>
              <AutoRow style={{ flexWrap: 'nowrap' }}>
                <ThemedText.Black fontSize={14}>
                  <Trans>
                    By connecting a wallet, you agree to Uniswap Labs’{' '}
                    <ExternalLink href="https://uniswap.org/terms-of-service/">Terms of Service</ExternalLink> and
                    acknowledge that you have read and understand the Uniswap{' '}
                    <ExternalLink href="https://uniswap.org/disclaimer/">Protocol Disclaimer</ExternalLink>.
                  </Trans>
                </ThemedText.Black>
              </AutoRow>
            </LightCard>
            {walletView === WALLET_VIEWS.PENDING ? <div>pending</div> : <OptionGrid>{getOptions()}</OptionGrid>}
            <LinkCard padding=".5rem" $borderRadius=".75rem" onClick={() => setWalletView(WALLET_VIEWS.LEGAL)}>
              <RowBetween>
                <AutoRow gap="4px">
                  <Info size={20} />
                  <ThemedText.Label fontSize={14}>
                    <Trans>How this app uses APIs</Trans>
                  </ThemedText.Label>
                </AutoRow>
                <ArrowRight size={16} />
              </RowBetween>
            </LinkCard>
          </AutoColumn>
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
