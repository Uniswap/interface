import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { AutoColumn } from 'components/Column'
import { PrivacyPolicy } from 'components/PrivacyPolicy'
import Row, { AutoRow } from 'components/Row'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import ReactGA from 'react-ga4'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateWalletError } from 'state/wallet/reducer'
import { updateWalletOverride } from 'state/walletOverride/reducer'
import styled from 'styled-components/macro'

import MetamaskIcon from '../../assets/images/metamask.png'
import TallyIcon from '../../assets/images/tally.png'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import {
  coinbaseWalletHooks,
  fortmatic,
  fortmaticHooks,
  getWalletForConnector,
  injected,
  injectedHooks,
  network,
  Wallet,
  walletConnectHooks,
} from '../../connectors'
import { SUPPORTED_WALLETS } from '../../constants/wallet'
import usePrevious from '../../hooks/usePrevious'
import { useModalOpen, useWalletModalToggle } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { ExternalLink, ThemedText } from '../../theme'
import { isMobile } from '../../utils/userAgent'
import AccountDetails from '../AccountDetails'
import { LightCard } from '../Card'
import Modal from '../Modal'
import Option from './Option'
import PendingView from './PendingView'

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
  const dispatch = useAppDispatch()
  const { connector } = useWeb3React()
  const isActiveMap: Partial<Record<Wallet, boolean>> = {
    [Wallet.INJECTED]: injectedHooks.useIsActive(),
    [Wallet.COINBASE_WALLET]: coinbaseWalletHooks.useIsActive(),
    [Wallet.WALLET_CONNECT]: walletConnectHooks.useIsActive(),
    [Wallet.FORTMATIC]: fortmaticHooks.useIsActive(),
  }

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)
  const previousWalletView = usePrevious(walletView)

  const [pendingConnector, setPendingConnector] = useState<Connector | undefined>()
  const pendingError = useAppSelector((state) =>
    pendingConnector ? state.wallet.errorByWallet[getWalletForConnector(pendingConnector)] : undefined
  )

  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useWalletModalToggle()

  const openOptions = useCallback(() => {
    setWalletView(WALLET_VIEWS.OPTIONS)
  }, [setWalletView])

  useEffect(() => {
    if (walletModalOpen) {
      setWalletView(connector === network ? WALLET_VIEWS.OPTIONS : WALLET_VIEWS.ACCOUNT)
    }
  }, [walletModalOpen, setWalletView, connector])

  useEffect(() => {
    if (pendingConnector && walletView !== WALLET_VIEWS.PENDING) {
      updateWalletError({ wallet: getWalletForConnector(pendingConnector), error: undefined })
      setPendingConnector(undefined)
    }
  }, [pendingConnector, walletView])

  const tryActivation = async (connector: Connector) => {
    const name = Object.values(SUPPORTED_WALLETS).find(
      (supportedWallet) => connector === supportedWallet.connector
    )?.name

    // log selected wallet
    ReactGA.event({
      category: 'Wallet',
      action: 'Change Wallet',
      label: name,
    })

    const wallet = getWalletForConnector(connector)

    try {
      // Fortmatic opens it's own modal on activation to log in. This modal has a tabIndex
      // collision into the WalletModal, so we special case by closing the modal.
      if (connector === fortmatic) {
        toggleWalletModal()
      }

      setPendingConnector(connector)
      setWalletView(WALLET_VIEWS.PENDING)

      if (isActiveMap[wallet]) {
        await connector.activate()
        setWalletView(WALLET_VIEWS.ACCOUNT)
        dispatch(updateWalletOverride({ wallet }))
      } else {
        await connector.activate()
      }

      dispatch(updateWalletError({ wallet, error: undefined }))
    } catch (error) {
      if (
        connector === fortmatic &&
        error.message === 'Fortmatic RPC Error: [-32603] Fortmatic: User denied account access.'
      ) {
        return
      }

      dispatch(updateWalletError({ wallet, error: error.message }))
    }
  }

  // get wallets user can switch too, depending on device/browser
  function getOptions() {
    const isMetamask = !!window.ethereum?.isMetaMask
    const isTally = !!window.ethereum?.isTally
    return Object.keys(SUPPORTED_WALLETS).map((key) => {
      const option = SUPPORTED_WALLETS[key]
      const isActive = option.connector === connector

      const optionProps = {
        active: isActive,
        id: `connect-${key}`,
        link: option.href,
        header: option.name,
        color: option.color,
        key,
        icon: option.iconURL,
      }

      // check for mobile options
      if (isMobile) {
        if (!window.web3 && !window.ethereum && option.mobile) {
          return (
            <Option
              {...optionProps}
              onClick={() => {
                if (!isActive && !option.href && !!option.connector) {
                  tryActivation(option.connector)
                }
              }}
              subheader={null}
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
        } else if (option.name === 'Injected' && isTally) {
          return (
            <Option
              id={`connect-${key}`}
              key={key}
              onClick={() => {
                option.connector === connector
                  ? setWalletView(WALLET_VIEWS.ACCOUNT)
                  : !option.href && option.connector && tryActivation(option.connector)
              }}
              color={'#E8831D'}
              header={<Trans>Tally</Trans>}
              active={option.connector === connector}
              subheader={null}
              link={null}
              icon={TallyIcon}
            />
          )
        }
      }

      // return rest of options
      return (
        !isMobile &&
        !option.mobileOnly && (
          <Option
            {...optionProps}
            onClick={() => {
              option.connector === connector
                ? setWalletView(WALLET_VIEWS.ACCOUNT)
                : !option.href && option.connector && tryActivation(option.connector)
            }}
            subheader={null} //use option.descriptio to bring back multi-line
          />
        )
      )
    })
  }

  function getModalContent() {
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
    if (walletView === WALLET_VIEWS.ACCOUNT) {
      return (
        <AccountDetails
          toggleWalletModal={toggleWalletModal}
          pendingTransactions={pendingTransactions}
          confirmedTransactions={confirmedTransactions}
          ENSName={ENSName}
          openOptions={openOptions}
        />
      )
    }
    return (
      <UpperSection>
        <CloseIcon onClick={toggleWalletModal}>
          <CloseColor />
        </CloseIcon>
        <HeaderRow color="blue">
          <HoverText onClick={() => setWalletView(WALLET_VIEWS.OPTIONS)}>
            <ArrowLeft />
          </HoverText>
        </HeaderRow>
        <ContentWrapper>
          <AutoColumn gap="16px">
            {walletView === WALLET_VIEWS.PENDING && pendingConnector && (
              <PendingView
                openOptions={openOptions}
                connector={pendingConnector}
                error={!!pendingError}
                tryActivation={tryActivation}
              />
            )}
            {walletView !== WALLET_VIEWS.PENDING && <OptionGrid data-cy="option-grid">{getOptions()}</OptionGrid>}
            {!pendingError && (
              <LightCard>
                <AutoRow style={{ flexWrap: 'nowrap' }}>
                  <ThemedText.Body fontSize={12}>
                    <Trans>
                      By connecting a wallet, you agree to Uniswap Labs’{' '}
                      <ExternalLink
                        style={{ textDecoration: 'underline' }}
                        href="https://uniswap.org/terms-of-service/"
                      >
                        Terms of Service
                      </ExternalLink>{' '}
                      and acknowledge that you have read and understand the Uniswap{' '}
                      <ExternalLink style={{ textDecoration: 'underline' }} href="https://uniswap.org/disclaimer/">
                        Protocol Disclaimer
                      </ExternalLink>
                      .
                    </Trans>
                  </ThemedText.Body>
                </AutoRow>
              </LightCard>
            )}
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
