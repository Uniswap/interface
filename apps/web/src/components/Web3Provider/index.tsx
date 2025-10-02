import { Web3Provider as EthersWeb3Provider, ExternalProvider } from '@ethersproject/providers'
import { recentConnectorIdAtom } from 'components/Web3Provider/constants'
import { createWeb3Provider } from 'components/Web3Provider/createWeb3Provider'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { walletTypeToAmplitudeWalletType } from 'components/Web3Provider/walletConnect'
import { RPC_PROVIDERS } from 'constants/providers'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import usePrevious from 'hooks/usePrevious'
import { useUpdateAtom } from 'jotai/utils'
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useConnectedWallets } from 'state/wallets/hooks'
import { CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'
import { CONVERSION_EVENTS } from 'uniswap/src/data/rest/conversionTracking/constants'
import { useConversionTracking } from 'uniswap/src/data/rest/conversionTracking/useConversionTracking'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletConnectionResult } from 'uniswap/src/features/telemetry/types'
import { InterfaceUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'
import { getWalletMeta, WalletType } from 'utils/walletMeta'
// biome-ignore lint/style/noRestrictedImports: Web3Provider needs direct ethers imports for provider setup
import { useAccount as useAccountWagmi } from 'wagmi'

// Production Web3Provider – always reconnects on mount and runs capability effects.
const Web3Provider = createWeb3Provider({ wagmiConfig })

export default Web3Provider

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
  const { trackConversions } = useConversionTracking(account.address)

  const updateRecentConnectorId = useUpdateAtom(recentConnectorIdAtom)
  useEffect(() => {
    if (connector) {
      updateRecentConnectorId(connector.id)
    }
  }, [connector, updateRecentConnectorId])

  // Trace RPC calls (for debugging).
  const shouldTrace = useFeatureFlag(FeatureFlags.TraceJsonRpc)
  // biome-ignore lint/correctness/useExhaustiveDependencies: +analyticsContext
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
        setUserProperty(InterfaceUserPropertyName.ChainId, accountWagmiChainId)
        setUserProperty(InterfaceUserPropertyName.AllWalletChainIds, accountWagmiChainId, true)
      }

      sendAnalyticsEvent(InterfaceEventName.ChainChanged, {
        result: WalletConnectionResult.Succeeded,
        wallet_address: account.address,
        wallet_type: walletTypeToAmplitudeWalletType(connector?.type),
        chain_id: accountWagmiChainId,
        previousConnectedChainId,
        page: currentPage,
      })
    }
  }, [account.address, accountWagmiChainId, connector?.type, currentPage, previousConnectedChainId])

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
          setUserProperty(InterfaceUserPropertyName.WalletVersion, clientVersion)
        })
        .catch((error) => {
          logger.warn('Web3Provider', 'Updater', 'Failed to get client version', error)
        })

      if (accountWagmiChainId) {
        setUserProperty(InterfaceUserPropertyName.ChainId, accountWagmiChainId)
        setUserProperty(InterfaceUserPropertyName.AllWalletChainIds, accountWagmiChainId, true)
      }

      setUserProperty(InterfaceUserPropertyName.WalletAddress, account.address)
      setUserProperty(InterfaceUserPropertyName.AllWalletAddressesConnected, account.address, true)

      setUserProperty(InterfaceUserPropertyName.WalletType, amplitudeWalletType)

      const walletConnectedProperties = {
        result: WalletConnectionResult.Succeeded,
        wallet_address: account.address,
        wallet_name: walletName,
        wallet_type: amplitudeWalletType,
        is_reconnect: isReconnect,
        peer_wallet_agent: peerWalletAgent,
        page: currentPage,
      }

      if (connector?.name === WalletType.WALLET_CONNECT) {
        try {
          connector
            .getProvider()
            .then((externalProvider) => {
              const provider = externalProvider as ExternalProvider
              // Lookup metadata from the wallet connect external provider
              const meta = getWalletMeta(new EthersWeb3Provider(provider))
              const name = meta?.name ?? walletName
              const agent = meta?.agent ?? peerWalletAgent

              setUserProperty(InterfaceUserPropertyName.WalletName, name)
              setUserProperty(InterfaceUserPropertyName.PeerWalletAgent, agent ?? '')
              sendAnalyticsEvent(InterfaceEventName.WalletConnected, {
                ...walletConnectedProperties,
                wallet_name: name,
                peer_wallet_agent: agent,
              })
            })
            .catch((error) => {
              logger.warn('Web3Provider', 'Updater', 'Failed to get wallet connect metadata', error)
            })
        } catch (error) {
          logger.warn('Web3Provider', 'Updater', 'Failed to call getProvider on WC connector', error)
        }
      } else {
        setUserProperty(InterfaceUserPropertyName.WalletName, walletName)
        setUserProperty(InterfaceUserPropertyName.PeerWalletAgent, peerWalletAgent ?? '')
        sendAnalyticsEvent(InterfaceEventName.WalletConnected, walletConnectedProperties)
      }

      if (walletName === CONNECTION_PROVIDER_NAMES.UNISWAP_EXTENSION) {
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
