import { Web3Provider as EthersWeb3Provider, ExternalProvider } from '@ethersproject/providers'
import { QueryClientProvider } from '@tanstack/react-query'
import { CustomUserProperties, InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { UNISWAP_EXTENSION_CONNECTOR_NAME, recentConnectorIdAtom } from 'components/Web3Provider/constants'
import { queryClient, wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { walletTypeToAmplitudeWalletType } from 'components/Web3Provider/walletConnect'
import { RPC_PROVIDERS } from 'constants/providers'
import { useAccount } from 'hooks/useAccount'
import { ConnectionProvider } from 'hooks/useConnect'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import usePrevious from 'hooks/usePrevious'
import { useUpdateAtom } from 'jotai/utils'
import { ReactNode, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useConnectedWallets } from 'state/wallets/hooks'
import { CONVERSION_EVENTS } from 'uniswap/src/data/rest/conversionTracking/constants'
import { useConversionTracking } from 'uniswap/src/data/rest/conversionTracking/useConversionTracking'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { setUserProperty } from 'uniswap/src/features/telemetry/user'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'
import { WalletType, getWalletMeta } from 'utils/walletMeta'
import { WagmiProvider, useAccount as useAccountWagmi } from 'wagmi'

export default function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider>{children}</ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

/** A component to run hooks under the Web3ReactProvider context. */
export function Web3ProviderUpdater() {
  const account = useAccount()
  const provider = useEthersWeb3Provider()

  const isSupportedChain = useIsSupportedChainId(account.chainId)
  const { connector } = useAccount()
  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)
  const analyticsContext = useTrace()
  const networkProvider = isSupportedChain && account.chainId ? RPC_PROVIDERS[account.chainId] : undefined
  const { trackConversions } = useConversionTracking()

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

  const accountWagmiChainId = useAccountWagmi().chainId // Direct using wagmi's account hook so we can log analytics for the user's wallet's chainId even if user is connected to unsupported chain
  const previousConnectedChainId = usePrevious(account.isConnected ? accountWagmiChainId : undefined)
  useEffect(() => {
    const chainChanged = previousConnectedChainId && previousConnectedChainId !== accountWagmiChainId
    if (chainChanged) {
      if (account.address && accountWagmiChainId) {
        // Should also update user property for chain_id when user switches chains
        setUserProperty(CustomUserProperties.CHAIN_ID, accountWagmiChainId)
        setUserProperty(CustomUserProperties.ALL_WALLET_CHAIN_IDS, accountWagmiChainId, true)
      }

      sendAnalyticsEvent(InterfaceEventName.CHAIN_CHANGED, {
        result: WalletConnectionResult.SUCCEEDED,
        wallet_address: account.address,
        wallet_type: connector?.name ?? 'Network',
        chain_id: accountWagmiChainId,
        previousConnectedChainId,
        page: currentPage,
      })
    }
  }, [account.address, accountWagmiChainId, connector?.name, currentPage, previousConnectedChainId])

  // Send analytics events when the active account changes.
  const previousAccount = usePrevious(account.address)
  const [connectedWallets, addConnectedWallet] = useConnectedWallets()
  useEffect(() => {
    // User properties *must* be set before sending corresponding event properties,
    // so that the event contains the correct and up-to-date user properties.
    if (account.address && account.address !== previousAccount) {
      const walletName = connector?.name ?? 'Network'
      const amplitudeWalletType = walletTypeToAmplitudeWalletType(connector?.type)
      const peerWalletAgent = provider ? getWalletMeta(provider)?.agent : undefined

      const isReconnect = connectedWallets.some(
        (wallet) => wallet.account === account.address && wallet.walletName === walletName,
      )

      provider
        ?.send('web3_clientVersion', [])
        .then((clientVersion) => {
          setUserProperty(CustomUserProperties.WALLET_VERSION, clientVersion)
        })
        .catch((error) => {
          logger.warn('Web3Provider', 'Updater', 'Failed to get client version', error)
        })

      if (accountWagmiChainId) {
        setUserProperty(CustomUserProperties.CHAIN_ID, accountWagmiChainId)
        setUserProperty(CustomUserProperties.ALL_WALLET_CHAIN_IDS, accountWagmiChainId, true)
      }

      setUserProperty(CustomUserProperties.WALLET_ADDRESS, account.address)
      setUserProperty(CustomUserProperties.ALL_WALLET_ADDRESSES_CONNECTED, account.address, true)

      setUserProperty(CustomUserProperties.WALLET_TYPE, amplitudeWalletType)

      const walletConnectedProperties = {
        result: WalletConnectionResult.SUCCEEDED,
        wallet_address: account.address,
        wallet_name: walletName,
        wallet_type: amplitudeWalletType,
        is_reconnect: isReconnect,
        peer_wallet_agent: peerWalletAgent,
        page: currentPage,
      }

      if (connector?.name === WalletType.WALLET_CONNECT) {
        connector
          ?.getProvider()
          .then((externalProvider) => {
            const provider = externalProvider as ExternalProvider
            // Lookup metadata from the wallet connect external provider
            const meta = getWalletMeta(new EthersWeb3Provider(provider))
            const name = meta?.name ?? walletName
            const agent = meta?.agent ?? peerWalletAgent

            setUserProperty(CustomUserProperties.WALLET_NAME, name)
            setUserProperty(CustomUserProperties.PEER_WALLET_AGENT, agent ?? '')
            sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECTED, {
              ...walletConnectedProperties,
              wallet_name: name,
              peer_wallet_agent: agent,
            })
          })
          .catch((error) => {
            logger.warn('Web3Provider', 'Updater', 'Failed to get wallet connect metadata', error)
          })
      } else {
        setUserProperty(CustomUserProperties.WALLET_NAME, walletName)
        setUserProperty(CustomUserProperties.PEER_WALLET_AGENT, peerWalletAgent ?? '')
        sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECTED, walletConnectedProperties)
      }

      if (walletName === UNISWAP_EXTENSION_CONNECTOR_NAME) {
        trackConversions(CONVERSION_EVENTS.Extension.Downloaded)
      }

      trackConversions(CONVERSION_EVENTS.Web.WalletConnected)

      addConnectedWallet({ account: account.address, walletName })
    }
  }, [
    account.address,
    accountWagmiChainId,
    addConnectedWallet,
    connectedWallets,
    connector,
    currentPage,
    previousAccount,
    provider,
    trackConversions,
  ])

  return null
}

function trace(event: any) {
  if (!event?.request) {
    return
  }
  const { method, id, params } = event.request
  logger.debug('Web3Provider', 'provider', 'trace', { method, id, params })
}
