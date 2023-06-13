import { sendAnalyticsEvent, user } from '@uniswap/analytics'
import { CustomUserProperties, InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { getWalletMeta } from '@uniswap/conedison/provider/meta'
import { useWeb3React, Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { getConnection } from 'connection'
import { isSupportedChain } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { TraceJsonRpcVariant, useTraceJsonRpcFlag } from 'featureFlags/flags/traceJsonRpc'
import useEagerlyConnect from 'hooks/useEagerlyConnect'
import useOrderedConnections from 'hooks/useOrderedConnections'
import usePrevious from 'hooks/usePrevious'
import { ReactNode, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useConnectedWallets } from 'state/wallets/hooks'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

export default function Web3Provider({ children }: { children: ReactNode }) {
  useEagerlyConnect()
  const connections = useOrderedConnections()
  const connectors: [Connector, Web3ReactHooks][] = connections.map(({ hooks, connector }) => [connector, hooks])

  const key = useMemo(() => connections.map((connection) => connection.getName()).join('-'), [connections])

  return (
    <Web3ReactProvider connectors={connectors} key={key}>
      <Updater />
      {children}
    </Web3ReactProvider>
  )
}

/** A component to run hooks under the Web3ReactProvider context. */
function Updater() {
  const { account, chainId, connector, provider } = useWeb3React()
  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)

  // Trace RPC calls (for debugging).
  const networkProvider = isSupportedChain(chainId) ? RPC_PROVIDERS[chainId] : undefined
  const shouldTrace = useTraceJsonRpcFlag() === TraceJsonRpcVariant.Enabled
  useEffect(() => {
    if (shouldTrace) {
      provider?.on('debug', trace)
      if (provider !== networkProvider) {
        networkProvider?.on('debug', trace)
      }
    }
    return () => {
      provider?.off('debug', trace)
      networkProvider?.off('debug', trace)
    }
  }, [networkProvider, provider, shouldTrace])

  // Send analytics events when the active account changes.
  const previousAccount = usePrevious(account)
  const [connectedWallets, addConnectedWallet] = useConnectedWallets()
  useEffect(() => {
    if (account && account !== previousAccount) {
      const walletType = getConnection(connector).getName()
      const peerWalletAgent = provider ? getWalletMeta(provider)?.agent : undefined
      const isReconnect = connectedWallets.some(
        (wallet) => wallet.account === account && wallet.walletType === walletType
      )

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
        page: currentPage,
      })

      addConnectedWallet({ account, walletType })
    }
  }, [account, addConnectedWallet, currentPage, chainId, connectedWallets, connector, previousAccount, provider])

  return null
}

function trace(event: any) {
  if (!event?.request) return
  const { method, id, params } = event.request
  console.groupCollapsed(method, id)
  console.debug(params)
  console.groupEnd()
}
