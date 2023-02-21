import { sendAnalyticsEvent, user } from '@uniswap/analytics'
import { CustomUserProperties, InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { getWalletMeta } from '@uniswap/conedison/provider/meta'
import { useWeb3React } from '@web3-react/core'
import { sendEvent } from 'components/analytics'
import { AutoColumn } from 'components/Column'
import { connectionErrorAtom } from 'components/WalletDropdown/DefaultMenu'
import { Connection, CONNECTIONS, ConnectionType, networkConnection } from 'connection'
import { getConnection } from 'connection'
import { ErrorCode } from 'connection/utils'
import { isSupportedChain } from 'constants/chains'
import { useAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import { useConnectedWallets } from 'state/wallets/hooks'
import styled from 'styled-components/macro'
import { flexColumnNoWrap } from 'theme/styles'

import ConnectionErrorView from './ConnectionErrorView'
import Option from './Option'
import PrivacyPolicyNotice from './PrivacyPolicyNotice'
const Wrapper = styled.div`
  ${flexColumnNoWrap};
  background-color: ${({ theme }) => theme.backgroundSurface};
  margin: 0;
  padding: 0;
  width: 100%;
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

const PrivacyPolicyWrapper = styled.div`
  padding: 0 4px;
`

const sendAnalyticsEventAndUserInfo = (
  account: string,
  walletType: string,
  chainId: number | undefined,
  isReconnect: boolean,
  peerWalletAgent: string | undefined
) => {
  // User properties *must* be set before sending corresponding event properties,
  // so that the event contains the correct and up-to-date user properties.
  user.set(CustomUserProperties.WALLET_ADDRESS, account)
  user.set(CustomUserProperties.WALLET_TYPE, walletType)
  user.set(CustomUserProperties.PEER_WALLET_AGENT, peerWalletAgent ?? '')
  if (chainId) {
    user.postInsert(CustomUserProperties.ALL_WALLET_CHAIN_IDS, chainId)
  }
  user.postInsert(CustomUserProperties.ALL_WALLET_ADDRESSES_CONNECTED, account)

  sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECT_TXN_COMPLETED, {
    result: WalletConnectionResult.SUCCEEDED,
    wallet_address: account,
    wallet_type: walletType,
    is_reconnect: isReconnect,
    peer_wallet_agent: peerWalletAgent,
  })
}

function didUserReject(connection: Connection, error: any): boolean {
  return (
    error?.code === ErrorCode.USER_REJECTED_REQUEST ||
    (connection.type === ConnectionType.WALLET_CONNECT && error?.toString?.() === ErrorCode.WC_MODAL_CLOSED) ||
    (connection.type === ConnectionType.COINBASE_WALLET && error?.toString?.() === ErrorCode.CB_REJECTED_REQUEST)
  )
}

export default function WalletModal() {
  const dispatch = useAppDispatch()
  const { connector, account, chainId, provider } = useWeb3React()

  const [connectedWallets, addWalletToConnectedWallets] = useConnectedWallets()
  const [lastActiveWalletAddress, setLastActiveWalletAddress] = useState<string | undefined>(account)
  const [pendingConnection, setPendingConnection] = useState<Connection | undefined>()
  const [pendingError, setPendingError] = useAtom(connectionErrorAtom)

  useEffect(() => {
    // Clean up errors when the dropdown closes
    return () => setPendingError(undefined)
  }, [setPendingError])

  const openOptions = useCallback(() => {
    if (pendingConnection) {
      setPendingError(undefined)
      setPendingConnection(undefined)
    }
  }, [pendingConnection, setPendingError])

  // Keep the network connector in sync with any active user connector to prevent chain-switching on wallet disconnection.
  useEffect(() => {
    if (chainId && isSupportedChain(chainId) && connector !== networkConnection.connector) {
      networkConnection.connector.activate(chainId)
    }
  }, [chainId, connector])

  // When new wallet is successfully set by the user, trigger logging of Amplitude analytics event.
  useEffect(() => {
    if (account && account !== lastActiveWalletAddress) {
      const walletName = getConnection(connector).name
      const peerWalletAgent = provider ? getWalletMeta(provider)?.agent : undefined
      const isReconnect =
        connectedWallets.filter((wallet) => wallet.account === account && wallet.walletType === walletName).length > 0
      sendAnalyticsEventAndUserInfo(account, walletName, chainId, isReconnect, peerWalletAgent)
      if (!isReconnect) addWalletToConnectedWallets({ account, walletType: walletName })
    }
    setLastActiveWalletAddress(account)
  }, [connectedWallets, addWalletToConnectedWallets, lastActiveWalletAddress, account, connector, chainId, provider])

  const tryActivation = useCallback(
    async (connection: Connection) => {
      // log selected wallet
      sendEvent({
        category: 'Wallet',
        action: 'Change Wallet',
        label: connection.type,
      })

      try {
        setPendingConnection(connection)
        setPendingError(undefined)

        await connection.connector.activate()

        dispatch(updateSelectedWallet({ wallet: connection.type }))
      } catch (error) {
        if (didUserReject(connection, error)) {
          setPendingConnection(undefined)
        } // Prevents showing error caused by MetaMask being prompted twice
        else if (error?.code !== ErrorCode.MM_ALREADY_PENDING) {
          console.debug(`web3-react connection error: ${error}`)
          setPendingError(error.message)

          sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECT_TXN_COMPLETED, {
            result: WalletConnectionResult.FAILED,
            wallet_type: connection.name,
          })
        }
      }
    },
    [dispatch, setPendingError]
  )

  return (
    <Wrapper data-testid="wallet-modal">
      {pendingError ? (
        pendingConnection && (
          <ConnectionErrorView openOptions={openOptions} retryActivation={() => tryActivation(pendingConnection)} />
        )
      ) : (
        <AutoColumn gap="16px">
          <OptionGrid data-testid="option-grid">
            {CONNECTIONS.map((connection) =>
              connection.shouldDisplay ? (
                <Option
                  key={connection.name}
                  connection={connection}
                  activate={connection.overrideActivate ?? (() => tryActivation(connection))}
                  pendingConnectionType={pendingConnection?.type}
                />
              ) : null
            )}
          </OptionGrid>
          <PrivacyPolicyWrapper>
            <PrivacyPolicyNotice />
          </PrivacyPolicyWrapper>
        </AutoColumn>
      )}
    </Wrapper>
  )
}
