import { QueryClientProvider } from '@tanstack/react-query'
import { CustomUserProperties, InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { recentConnectorIdAtom } from 'components/Web3Provider/constants'
import { queryClient, wagmiConfig } from 'components/Web3Provider/wagmi'
import { useIsSupportedChainId } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import usePrevious from 'hooks/usePrevious'
import { useUpdateAtom } from 'jotai/utils'
import { ReactNode, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useConnectedWallets } from 'state/wallets/hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { setUserProperty } from 'uniswap/src/features/telemetry/user'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'
import { getWalletMeta } from 'utils/walletMeta'
import { WagmiProvider } from 'wagmi'

export default function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Updater />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

/** A component to run hooks under the Web3ReactProvider context. */
function Updater() {
  const { address: account, chainId } = useAccount()
  const provider = useEthersWeb3Provider()

  const isSupportedChain = useIsSupportedChainId(chainId)
  const { connector } = useAccount()
  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)
  const analyticsContext = useTrace()
  const networkProvider = isSupportedChain ? RPC_PROVIDERS[chainId] : undefined

  const updateRecentConnectorId = useUpdateAtom(recentConnectorIdAtom)
  useEffect(() => {
    if (connector) {
      updateRecentConnectorId(connector.id)
    }
  }, [connector, updateRecentConnectorId])

  // Trace RPC calls (for debugging).
  const shouldTrace = useFeatureFlag(FeatureFlags.TraceJsonRpc)
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
  }, [analyticsContext, networkProvider, provider, shouldTrace])

  const previousConnectedChainId = usePrevious(chainId)
  useEffect(() => {
    const chainChanged = previousConnectedChainId && previousConnectedChainId !== chainId
    if (chainChanged) {
      sendAnalyticsEvent(InterfaceEventName.CHAIN_CHANGED, {
        result: WalletConnectionResult.SUCCEEDED,
        wallet_address: account,
        wallet_type: connector?.name ?? 'Network',
        chain_id: chainId,
        previousConnectedChainId,
        page: currentPage,
      })
    }
  }, [account, chainId, connector, currentPage, previousConnectedChainId])

  // Send analytics events when the active account changes.
  const previousAccount = usePrevious(account)
  const [connectedWallets, addConnectedWallet] = useConnectedWallets()
  useEffect(() => {
    if (account && account !== previousAccount) {
      const walletType = connector?.name ?? 'Network'
      const peerWalletAgent = provider ? getWalletMeta(provider)?.agent : undefined

      const isReconnect = connectedWallets.some(
        (wallet) => wallet.account === account && wallet.walletType === walletType
      )

      provider
        ?.send('web3_clientVersion', [])
        .then((clientVersion) => {
          setUserProperty(CustomUserProperties.WALLET_VERSION, clientVersion)
        })
        .catch((error) => {
          console.warn('Failed to get client version', error)
        })

      // User properties *must* be set before sending corresponding event properties,
      // so that the event contains the correct and up-to-date user properties.
      setUserProperty(CustomUserProperties.WALLET_ADDRESS, account)
      setUserProperty(CustomUserProperties.ALL_WALLET_ADDRESSES_CONNECTED, account, true)

      setUserProperty(CustomUserProperties.WALLET_TYPE, walletType)
      setUserProperty(CustomUserProperties.PEER_WALLET_AGENT, peerWalletAgent ?? '')
      if (chainId) {
        setUserProperty(CustomUserProperties.CHAIN_ID, chainId)
        setUserProperty(CustomUserProperties.ALL_WALLET_CHAIN_IDS, chainId, true)
      }

      sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECTED, {
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
  if (!event?.request) {
    return
  }
  const { method, id, params } = event.request
  console.groupCollapsed(method, id)
  console.debug(params)
  console.groupEnd()
}
