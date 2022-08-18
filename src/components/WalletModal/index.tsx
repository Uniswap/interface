import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { sendAnalyticsEvent, user } from 'components/AmplitudeAnalytics'
import {
  CUSTOM_USER_PROPERTIES,
  CUSTOM_USER_PROPERTY_SUFFIXES,
  EventName,
  WALLET_CONNECTION_RESULT,
} from 'components/AmplitudeAnalytics/constants'
import { formatToDecimal, getTokenAddress } from 'components/AmplitudeAnalytics/utils'
import { sendEvent } from 'components/analytics'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { ConnectionType } from 'connection'
import { getConnection, getConnectionName, getIsCoinbaseWallet, getIsInjected, getIsMetaMask } from 'connection/utils'
import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
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
import { useConnectedWallets } from 'state/wallets/hooks'
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

const Wrapper = styled.div<{ redesignFlag?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  background-color: ${({ redesignFlag, theme }) => redesignFlag && theme.backgroundSurface};
  outline: ${({ theme, redesignFlag }) => redesignFlag && `1px solid ${theme.backgroundOutline}`};
  box-shadow: ${({ redesignFlag, theme }) => redesignFlag && theme.deepShadow};
  margin: 0;
  padding: 0;
  width: 100%;
`

const HeaderRow = styled.div<{ redesignFlag?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 1rem 1rem;
  font-weight: ${({ redesignFlag }) => (redesignFlag ? '600' : '500')};
  size: ${({ redesignFlag }) => redesignFlag && '16px'};
  color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.deprecated_primary1 : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const ContentWrapper = styled.div<{ redesignFlag?: boolean }>`
  background-color: ${({ theme, redesignFlag }) => (redesignFlag ? theme.backgroundSurface : theme.deprecated_bg0)};
  border: ${({ theme, redesignFlag }) => redesignFlag && `1px solid ${theme.backgroundOutline}`};
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

const sendAnalyticsWalletBalanceUserInfo = (
  balances: (CurrencyAmount<Currency> | undefined)[],
  nativeCurrencyBalanceUsd: number
) => {
  const walletTokensSymbols: string[] = []
  const walletTokensAddresses: string[] = []
  balances.forEach((currencyAmount) => {
    if (currencyAmount !== undefined) {
      const tokenBalanceAmount = formatToDecimal(currencyAmount, currencyAmount.currency.decimals)
      if (tokenBalanceAmount > 0) {
        const tokenAddress = getTokenAddress(currencyAmount.currency)
        walletTokensAddresses.push(getTokenAddress(currencyAmount.currency))
        walletTokensSymbols.push(currencyAmount.currency.symbol ?? '')
        const tokenPrefix = currencyAmount.currency.symbol ?? tokenAddress
        user.set(`${tokenPrefix}${CUSTOM_USER_PROPERTY_SUFFIXES.WALLET_TOKEN_AMOUNT_SUFFIX}`, tokenBalanceAmount)
      }
    }
  })
  user.set(CUSTOM_USER_PROPERTIES.WALLET_NATIVE_CURRENCY_BALANCE_USD, nativeCurrencyBalanceUsd)
  user.set(CUSTOM_USER_PROPERTIES.WALLET_TOKENS_ADDRESSES, walletTokensAddresses)
  user.set(CUSTOM_USER_PROPERTIES.WALLET_TOKENS_SYMBOLS, walletTokensSymbols)
}

const sendAnalyticsEventAndUserInfo = (
  account: string,
  walletType: string,
  chainId: number | undefined,
  isReconnect: boolean
) => {
  sendAnalyticsEvent(EventName.WALLET_CONNECT_TXN_COMPLETED, {
    result: WALLET_CONNECTION_RESULT.SUCCEEDED,
    wallet_address: account,
    wallet_type: walletType,
    is_reconnect: isReconnect,
  })
  user.set(CUSTOM_USER_PROPERTIES.WALLET_ADDRESS, account)
  user.set(CUSTOM_USER_PROPERTIES.WALLET_TYPE, walletType)
  if (chainId) {
    user.postInsert(CUSTOM_USER_PROPERTIES.ALL_WALLET_CHAIN_IDS, chainId)
  }
  user.postInsert(CUSTOM_USER_PROPERTIES.ALL_WALLET_ADDRESSES_CONNECTED, account)
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
  const [connectedWallets, addWalletToConnectedWallets] = useConnectedWallets()

  const redesignFlag = useRedesignFlag()
  const redesignFlagEnabled = redesignFlag === RedesignVariant.Enabled
  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)
  const [lastActiveWalletAddress, setLastActiveWalletAddress] = useState<string | undefined>(account)
  const [shouldLogWalletBalances, setShouldLogWalletBalances] = useState(false)

  const [pendingConnector, setPendingConnector] = useState<Connector | undefined>()
  const pendingError = useAppSelector((state) =>
    pendingConnector ? state.connection.errorByConnectionType[getConnection(pendingConnector).type] : undefined
  )

  const walletModalOpen = useModalIsOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useToggleWalletModal()

  const allTokens = useAllTokens()
  const [tokenBalances, tokenBalancesIsLoading] = useAllTokenBalances()
  const sortedTokens: Token[] = useMemo(
    () => (!tokenBalancesIsLoading ? Object.values(allTokens).sort(tokenComparator.bind(null, tokenBalances)) : []),
    [tokenBalances, allTokens, tokenBalancesIsLoading]
  )
  const native = useNativeCurrency()

  const sortedTokensWithETH: Currency[] = useMemo(
    () =>
      // Always bump the native token to the top of the list.
      native ? [native, ...sortedTokens.filter((t) => !t.equals(native))] : sortedTokens,
    [native, sortedTokens]
  )

  const balances = useCurrencyBalances(account, sortedTokensWithETH)
  const nativeBalance = balances.length > 0 ? balances[0] : null
  const nativeCurrencyBalanceUsdValue = useStablecoinValue(nativeBalance)?.toFixed(2)

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
      const isReconnect =
        connectedWallets.filter((wallet) => wallet.account === account && wallet.walletType === walletType).length > 0
      sendAnalyticsEventAndUserInfo(account, walletType, chainId, isReconnect)
      setShouldLogWalletBalances(true)
      if (!isReconnect) addWalletToConnectedWallets({ account, walletType })
    }
    setLastActiveWalletAddress(account)
  }, [connectedWallets, addWalletToConnectedWallets, lastActiveWalletAddress, account, connector, chainId])

  // Send wallet balance info once it becomes available.
  useEffect(() => {
    if (!tokenBalancesIsLoading && shouldLogWalletBalances && balances && nativeCurrencyBalanceUsdValue) {
      const nativeCurrencyBalanceUsd =
        native && nativeCurrencyBalanceUsdValue ? parseFloat(nativeCurrencyBalanceUsdValue) : 0
      sendAnalyticsWalletBalanceUserInfo(balances, nativeCurrencyBalanceUsd)
      setShouldLogWalletBalances(false)
    }
  }, [
    balances,
    nativeCurrencyBalanceUsdValue,
    shouldLogWalletBalances,
    setShouldLogWalletBalances,
    tokenBalancesIsLoading,
    native,
  ])

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
    if (walletView === WALLET_VIEWS.PENDING || walletView === WALLET_VIEWS.ACCOUNT || !!account) {
      headerRow = (
        <HeaderRow color="blue">
          <HoverText onClick={() => setWalletView(account ? WALLET_VIEWS.ACCOUNT : WALLET_VIEWS.OPTIONS)}>
            <ArrowLeft />
          </HoverText>
        </HeaderRow>
      )
    } else {
      headerRow = (
        <HeaderRow redesignFlag={redesignFlagEnabled}>
          <HoverText>
            <Trans>Connect a wallet</Trans>
          </HoverText>
        </HeaderRow>
      )
    }

    function getTermsOfService(redesignFlagEnabled: boolean) {
      return redesignFlagEnabled ? (
        <AutoRow style={{ flexWrap: 'nowrap', padding: '4px 16px' }}>
          <ThemedText.BodySecondary fontSize={12}>
            <Trans>
              By connecting a wallet, you agree to Uniswap Labs’{' '}
              <ExternalLink href="https://uniswap.org/terms-of-service/">Terms of Service</ExternalLink> and acknowledge
              that you have read and understand the Uniswap{' '}
              <ExternalLink href="https://uniswap.org/disclaimer/">Protocol Disclaimer</ExternalLink>.
            </Trans>
          </ThemedText.BodySecondary>
        </AutoRow>
      ) : (
        <LightCard>
          <AutoRow style={{ flexWrap: 'nowrap' }}>
            <ThemedText.DeprecatedBody fontSize={12}>
              <Trans>
                By connecting a wallet, you agree to Uniswap Labs’{' '}
                <ExternalLink style={{ textDecoration: 'underline' }} href="https://uniswap.org/terms-of-service/">
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
            {!pendingError && getTermsOfService(redesignFlagEnabled)}
          </AutoColumn>
        </ContentWrapper>
      </UpperSection>
    )
  }

  return (
    <Modal
      isOpen={walletModalOpen}
      onDismiss={toggleWalletModal}
      minHeight={false}
      maxHeight={90}
      redesignFlag={redesignFlagEnabled}
    >
      <Wrapper redesignFlag={redesignFlagEnabled}>{getModalContent()}</Wrapper>
    </Modal>
  )
}
