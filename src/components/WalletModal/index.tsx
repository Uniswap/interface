import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { sendAnalyticsEvent, user } from 'components/AmplitudeAnalytics'
import { CUSTOM_USER_PROPERTIES, EventName, WALLET_CONNECTION_RESULT } from 'components/AmplitudeAnalytics/constants'
import { formatToDecimal, getTokenAddress } from 'components/AmplitudeAnalytics/utils'
import { sendEvent } from 'components/analytics'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { ConnectionType } from 'connection'
import { getConnection, getConnectionName, getIsCoinbaseWallet, getIsInjected, getIsMetaMask } from 'connection/utils'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { tokenComparator } from 'lib/hooks/useTokenList/sorting'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { useAllTokenBalances } from 'state/connection/hooks'
import { updateConnectionError } from 'state/connection/reducer'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import styled from 'styled-components/macro'
import { isMobile } from 'utils/userAgent'

import { ReactComponent as Close } from '../../assets/images/x.svg'
import { useAllTokens } from '../../hooks/Tokens'
import { useModalIsOpen, useToggleWalletModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { ExternalLink, ThemedText } from '../../theme'
import AccountDetails from '../AccountDetails'
import { LightCard } from '../Card'
import Modal from '../Modal'
import { CoinbaseWalletOption, OpenCoinbaseWalletOption } from './CoinbaseWalletOption'
import { FortmaticOption } from './FortmaticOption'
import { InjectedOption, InstallMetaMaskOption, MetaMaskOption } from './InjectedOption'
import PendingView from './PendingView'
import { WalletConnectOption } from './WalletConnectOption'

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
    stroke: ${({ theme }) => theme.deprecated_text4};
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
  color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.deprecated_primary1 : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const ContentWrapper = styled.div`
  background-color: ${({ theme }) => theme.deprecated_bg0};
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
  color: ${({ theme }) => theme.deprecated_text1};
  display: flex;
  align-items: center;

  :hover {
    cursor: pointer;
  }
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  ACCOUNT: 'account',
  PENDING: 'pending',
}

const modifyUserModelWithCustomWalletProperties = (
  account: string,
  walletType: string,
  chainId: number | undefined,
  balances: (CurrencyAmount<Currency> | undefined)[],
  nativeCurrencyBalanceUsd: number
) => {
  const currentDate = new Date().toISOString()
  const walletTokensSymbols: string[] = []
  const walletTokensAddresses: string[] = []
  const walletTokensBalancesAmount: number[] = []
  balances.forEach((currencyAmount) => {
    if (currencyAmount !== undefined) {
      const tokenBalanceAmount = formatToDecimal(currencyAmount, currencyAmount.currency.decimals)
      if (tokenBalanceAmount > 0) {
        walletTokensAddresses.push(getTokenAddress(currencyAmount.currency))
        walletTokensSymbols.push(currencyAmount.currency.symbol ?? '')
        walletTokensBalancesAmount.push(tokenBalanceAmount)
      }
    }
  })
  user.set(CUSTOM_USER_PROPERTIES.WALLET_ADDRESS, account)
  user.set(CUSTOM_USER_PROPERTIES.WALLET_TYPE, walletType)
  if (chainId) {
    user.postInsert(CUSTOM_USER_PROPERTIES.ALL_WALLET_CHAIN_IDS, chainId)
    user.postInsert(`${CUSTOM_USER_PROPERTIES.WALLET_CHAIN_IDS_PREFIX}${account}`, chainId)
  }
  user.postInsert(CUSTOM_USER_PROPERTIES.ALL_WALLET_ADDRESSES_CONNECTED, account)
  user.setOnce(`${CUSTOM_USER_PROPERTIES.WALLET_FIRST_SEEN_DATE_PREFIX}${account}`, currentDate)
  user.set(`${CUSTOM_USER_PROPERTIES.WALLET_LAST_SEEN_DATE_PREFIX}${account}`, currentDate)
  user.set(CUSTOM_USER_PROPERTIES.WALLET_NATIVE_CURRENCY_BALANCE_USD, nativeCurrencyBalanceUsd)
  user.set(CUSTOM_USER_PROPERTIES.WALLET_TOKENS_ADDRESSES, walletTokensAddresses)
  user.set(CUSTOM_USER_PROPERTIES.WALLET_TOKENS_SYMBOLS, walletTokensSymbols)
  user.set(CUSTOM_USER_PROPERTIES.WALLET_TOKENS_BALANCES_AMOUNT, walletTokensBalancesAmount)
}

const sendAnalyticsEventAndUserInfo = (
  account: string,
  walletType: string,
  chainId: number | undefined,
  balances: (CurrencyAmount<Currency> | undefined)[],
  nativeCurrencyBalanceUsd: number
) => {
  sendAnalyticsEvent(EventName.WALLET_CONNECT_TXN_COMPLETED, {
    result: WALLET_CONNECTION_RESULT.SUCCEEDED,
    wallet_address: account,
    wallet_type: walletType,
    // TODO(lynnshaoyu): Send correct is_reconnect value after modifying user state.
  })
  modifyUserModelWithCustomWalletProperties(account, walletType, chainId, balances, nativeCurrencyBalanceUsd)
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
  const { connector, account, chainId } = useWeb3React()

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)
  const [lastActiveWalletAddress, setLastActiveWalletAddress] = useState<string | undefined>(account)

  const [pendingConnector, setPendingConnector] = useState<Connector | undefined>()
  const pendingError = useAppSelector((state) =>
    pendingConnector ? state.connection.errorByConnectionType[getConnection(pendingConnector).type] : undefined
  )

  const walletModalOpen = useModalIsOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useToggleWalletModal()

  const allTokens = useAllTokens()
  const [tokenBalances, tokenBalancesIsLoading] = useAllTokenBalances()
  const sortedTokens: Token[] = useMemo(() => {
    void tokenBalancesIsLoading // creates a new array once balances load to update hooks
    return Object.values(allTokens).sort(tokenComparator.bind(null, tokenBalances))
  }, [tokenBalances, allTokens, tokenBalancesIsLoading])
  const native = useNativeCurrency()

  const sortedTokensWithETH: Currency[] = useMemo(() => {
    // Use Celo ERC20 Implementation and exclude the native asset
    if (!native) {
      return sortedTokens
    }
    // Always bump the native token to the top of the list.
    return native ? [native, ...sortedTokens.filter((t) => !t.equals(native))] : sortedTokens
  }, [native, sortedTokens])

  const balances = useCurrencyBalances(account, sortedTokensWithETH)

  const nativeCurrencyBalanceUsdValue = useStablecoinValue(balances[0])?.toFixed(2)
  const nativeCurrencyBalanceUsd =
    native && nativeCurrencyBalanceUsdValue ? parseFloat(nativeCurrencyBalanceUsdValue) : 0

  const openOptions = useCallback(() => {
    setWalletView(WALLET_VIEWS.OPTIONS)
  }, [setWalletView])

  useEffect(() => {
    if (walletModalOpen) {
      setWalletView(account ? WALLET_VIEWS.ACCOUNT : WALLET_VIEWS.OPTIONS)
    }
  }, [walletModalOpen, setWalletView, account])

  useEffect(() => {
    if (pendingConnector && walletView !== WALLET_VIEWS.PENDING) {
      updateConnectionError({ connectionType: getConnection(pendingConnector).type, error: undefined })
      setPendingConnector(undefined)
    }
  }, [pendingConnector, walletView])

  // When new wallet is successfully set by the user, trigger logging of Amplitude analytics event.
  useEffect(() => {
    if (account && account !== lastActiveWalletAddress) {
      const walletType = getConnectionName(getConnection(connector).type, getIsMetaMask())
      sendAnalyticsEventAndUserInfo(account, walletType, chainId, balances, nativeCurrencyBalanceUsd)
    }
    setLastActiveWalletAddress(account)
  }, [lastActiveWalletAddress, account, connector, chainId, balances, nativeCurrencyBalanceUsd])

  const tryActivation = useCallback(
    async (connector: Connector) => {
      const connectionType = getConnection(connector).type

      // log selected wallet
      sendEvent({
        category: 'Wallet',
        action: 'Change Wallet',
        label: connectionType,
      })

      try {
        // Fortmatic opens it's own modal on activation to log in. This modal has a tabIndex
        // collision into the WalletModal, so we special case by closing the modal.
        if (connectionType === ConnectionType.FORTMATIC) {
          toggleWalletModal()
        }

        setPendingConnector(connector)
        setWalletView(WALLET_VIEWS.PENDING)
        dispatch(updateConnectionError({ connectionType, error: undefined }))

        await connector.activate()

        dispatch(updateSelectedWallet({ wallet: connectionType }))
      } catch (error) {
        console.debug(`web3-react connection error: ${error}`)
        dispatch(updateConnectionError({ connectionType, error: error.message }))

        sendAnalyticsEvent(EventName.WALLET_CONNECT_TXN_COMPLETED, {
          result: WALLET_CONNECTION_RESULT.FAILED,
          wallet_type: getConnectionName(connectionType, getIsMetaMask()),
        })
      }
    },
    [dispatch, toggleWalletModal]
  )

  function getOptions() {
    const isInjected = getIsInjected()
    const isMetaMask = getIsMetaMask()
    const isCoinbaseWallet = getIsCoinbaseWallet()

    const isCoinbaseWalletBrowser = isMobile && isCoinbaseWallet
    const isMetaMaskBrowser = isMobile && isMetaMask
    const isInjectedMobileBrowser = isCoinbaseWalletBrowser || isMetaMaskBrowser

    let injectedOption
    if (!isInjected) {
      if (!isMobile) {
        injectedOption = <InstallMetaMaskOption />
      }
    } else if (!isCoinbaseWallet) {
      if (isMetaMask) {
        injectedOption = <MetaMaskOption tryActivation={tryActivation} />
      } else {
        injectedOption = <InjectedOption tryActivation={tryActivation} />
      }
    }

    let coinbaseWalletOption
    if (isMobile && !isInjectedMobileBrowser) {
      coinbaseWalletOption = <OpenCoinbaseWalletOption />
    } else if (!isMobile || isCoinbaseWalletBrowser) {
      coinbaseWalletOption = <CoinbaseWalletOption tryActivation={tryActivation} />
    }

    const walletConnectionOption =
      (!isInjectedMobileBrowser && <WalletConnectOption tryActivation={tryActivation} />) ?? null

    const fortmaticOption = (!isInjectedMobileBrowser && <FortmaticOption tryActivation={tryActivation} />) ?? null

    return (
      <>
        {injectedOption}
        {coinbaseWalletOption}
        {walletConnectionOption}
        {fortmaticOption}
      </>
    )
  }

  function getModalContent() {
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

    let headerRow
    if (walletView === WALLET_VIEWS.PENDING) {
      headerRow = null
    } else if (walletView === WALLET_VIEWS.ACCOUNT || !!account) {
      headerRow = (
        <HeaderRow color="blue">
          <HoverText onClick={() => setWalletView(account ? WALLET_VIEWS.ACCOUNT : WALLET_VIEWS.OPTIONS)}>
            <ArrowLeft />
          </HoverText>
        </HeaderRow>
      )
    } else {
      headerRow = (
        <HeaderRow>
          <HoverText>
            <Trans>Connect a wallet</Trans>
          </HoverText>
        </HeaderRow>
      )
    }

    return (
      <UpperSection>
        <CloseIcon onClick={toggleWalletModal}>
          <CloseColor />
        </CloseIcon>
        {headerRow}
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
            {walletView !== WALLET_VIEWS.PENDING && <OptionGrid data-testid="option-grid">{getOptions()}</OptionGrid>}
            {!pendingError && (
              <LightCard>
                <AutoRow style={{ flexWrap: 'nowrap' }}>
                  <ThemedText.DeprecatedBody fontSize={12}>
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
                  </ThemedText.DeprecatedBody>
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
