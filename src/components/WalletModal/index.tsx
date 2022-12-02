import { sendAnalyticsEvent, user } from '@uniswap/analytics'
import { CustomUserProperties, EventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { sendEvent } from 'components/analytics'
import { AutoColumn } from 'components/Column'
import { networkConnection } from 'connection'
import { getConnection, getConnectionName, getIsCoinbaseWallet, getIsInjected, getIsMetaMask } from 'connection/utils'
import { useCallback, useEffect, useState } from 'react'
import { updateConnectionError } from 'state/connection/reducer'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import { useConnectedWallets } from 'state/wallets/hooks'
import styled from 'styled-components/macro'
import { flexColumnNoWrap } from 'theme/styles'
import { isMobile } from 'utils/userAgent'

import { CoinbaseWalletOption, OpenCoinbaseWalletOption } from './CoinbaseWalletOption'
import { InjectedOption, InstallMetaMaskOption, MetaMaskOption } from './InjectedOption'
import PendingView from './PendingView'
import { UniwalletOption } from './UniwalletOption'
import { WalletConnectOption } from './WalletConnectOption'

const Wrapper = styled.div`
  ${flexColumnNoWrap};
  background-color: ${({ theme }) => theme.backgroundSurface};
  margin: 0;
  padding: 0;
  width: 100%;
`

const ContentWrapper = styled.div`
  background-color: ${({ theme }) => theme.backgroundSurface};
  padding: 0 1rem 1rem 1rem;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`padding: 0 1rem 1rem 1rem`};
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
  grid-gap: 2px;
  border-radius: 12px;
  overflow: hidden;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    grid-template-columns: 1fr;
  `};
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  ACCOUNT: 'account',
  PENDING: 'pending',
}

const sendAnalyticsEventAndUserInfo = (
  account: string,
  walletType: string,
  chainId: number | undefined,
  isReconnect: boolean
) => {
  sendAnalyticsEvent(EventName.WALLET_CONNECT_TXN_COMPLETED, {
    result: WalletConnectionResult.SUCCEEDED,
    wallet_address: account,
    wallet_type: walletType,
    is_reconnect: isReconnect,
  })
  user.set(CustomUserProperties.WALLET_ADDRESS, account)
  user.set(CustomUserProperties.WALLET_TYPE, walletType)
  if (chainId) {
    user.postInsert(CustomUserProperties.ALL_WALLET_CHAIN_IDS, chainId)
  }
  user.postInsert(CustomUserProperties.ALL_WALLET_ADDRESSES_CONNECTED, account)
}

export default function WalletModal() {
  const dispatch = useAppDispatch()
  const { connector, account, chainId } = useWeb3React()

  const [connectedWallets, addWalletToConnectedWallets] = useConnectedWallets()
  const [walletView, setWalletView] = useState(account ? WALLET_VIEWS.ACCOUNT : WALLET_VIEWS.OPTIONS)
  const [lastActiveWalletAddress, setLastActiveWalletAddress] = useState<string | undefined>(account)

  const [pendingConnector, setPendingConnector] = useState<Connector | undefined>()
  const pendingError = useAppSelector((state) =>
    pendingConnector ? state.connection.errorByConnectionType[getConnection(pendingConnector).type] : undefined
  )

  const openOptions = useCallback(() => {
    setWalletView(WALLET_VIEWS.OPTIONS)
  }, [setWalletView])

  useEffect(() => {
    setWalletView(account ? WALLET_VIEWS.ACCOUNT : WALLET_VIEWS.OPTIONS)
  }, [setWalletView, account])

  useEffect(() => {
    if (pendingConnector && walletView !== WALLET_VIEWS.PENDING) {
      updateConnectionError({ connectionType: getConnection(pendingConnector).type, error: undefined })
      setPendingConnector(undefined)
    }
  }, [pendingConnector, walletView])

  // Keep the network connector in sync with any active user connector to prevent chain-switching on wallet disconnection.
  useEffect(() => {
    if (chainId && connector !== networkConnection.connector) {
      networkConnection.connector.activate(chainId)
    }
  }, [chainId, connector])

  // When new wallet is successfully set by the user, trigger logging of Amplitude analytics event.
  useEffect(() => {
    if (account && account !== lastActiveWalletAddress) {
      const walletType = getConnectionName(getConnection(connector).type, getIsMetaMask())
      const isReconnect =
        connectedWallets.filter((wallet) => wallet.account === account && wallet.walletType === walletType).length > 0
      sendAnalyticsEventAndUserInfo(account, walletType, chainId, isReconnect)
      if (!isReconnect) addWalletToConnectedWallets({ account, walletType })
    }
    setLastActiveWalletAddress(account)
  }, [connectedWallets, addWalletToConnectedWallets, lastActiveWalletAddress, account, connector, chainId])

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
        setPendingConnector(connector)
        setWalletView(WALLET_VIEWS.PENDING)
        dispatch(updateConnectionError({ connectionType, error: undefined }))

        await connector.activate()

        dispatch(updateSelectedWallet({ wallet: connectionType }))
      } catch (error) {
        console.debug(`web3-react connection error: ${error}`)
        dispatch(updateConnectionError({ connectionType, error: error.message }))

        sendAnalyticsEvent(EventName.WALLET_CONNECT_TXN_COMPLETED, {
          result: WalletConnectionResult.FAILED,
          wallet_type: getConnectionName(connectionType, getIsMetaMask()),
        })
      }
    },
    [dispatch]
  )

  const isInjected = getIsInjected()
  const isMetaMask = getIsMetaMask()
  const isCoinbaseWallet = getIsCoinbaseWallet()

  const isCoinbaseWalletBrowser = isMobile && isCoinbaseWallet
  const isMetaMaskBrowser = isMobile && isMetaMask
  const isInjectedMobileBrowser = isCoinbaseWalletBrowser || isMetaMaskBrowser

  return (
    <Wrapper data-testid="wallet-modal">
      <UpperSection>
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
            {walletView !== WALLET_VIEWS.PENDING && (
              <OptionGrid data-testid="option-grid">
                <>
                  <UniwalletOption tryActivation={tryActivation} />
                  {!isInjected
                    ? !isMobile && <InstallMetaMaskOption />
                    : !isCoinbaseWallet &&
                      (isMetaMask ? (
                        <MetaMaskOption tryActivation={tryActivation} />
                      ) : (
                        <InjectedOption tryActivation={tryActivation} />
                      ))}
                  {!isInjectedMobileBrowser ? <WalletConnectOption tryActivation={tryActivation} /> : null}
                  {isMobile && !isInjectedMobileBrowser ? (
                    <OpenCoinbaseWalletOption />
                  ) : !isMobile || isCoinbaseWalletBrowser ? (
                    <CoinbaseWalletOption tryActivation={tryActivation} />
                  ) : null}
                </>
              </OptionGrid>
            )}
          </AutoColumn>
        </ContentWrapper>
      </UpperSection>
    </Wrapper>
  )
}
