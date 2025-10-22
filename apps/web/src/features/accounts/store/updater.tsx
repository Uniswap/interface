import { Web3Provider as EthersWeb3Provider, ExternalProvider } from '@ethersproject/providers'
import { recentConnectorIdAtom } from 'components/Web3Provider/constants'
import { RPC_PROVIDERS } from 'constants/providers'
import { useActiveAddresses, useActiveWallet, useConnectionStatus } from 'features/accounts/store/hooks'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import usePrevious from 'hooks/usePrevious'
import { useUpdateAtom } from 'jotai/utils'
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'
import { CONVERSION_EVENTS } from 'uniswap/src/data/rest/conversionTracking/constants'
import { useConversionTracking } from 'uniswap/src/data/rest/conversionTracking/useConversionTracking'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletConnectedProperties, WalletConnectionResult } from 'uniswap/src/features/telemetry/types'
import { InterfaceUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'
import { getWalletMeta, WalletType } from 'utils/walletMeta'
// biome-ignore lint/style/noRestrictedImports: direct wagmi hooks needed so we can access user's chainId even if unsupported chain
import { useAccount as useAccountWagmi } from 'wagmi'

/** A component to run hooks under the WebAccountsStore contexts. */
export function WebAccountsStoreUpdater() {
  const account = useAccount()
  const evmConnector = account.connector
  const provider = useEthersWeb3Provider()

  const analyticsContext = useTrace()
  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)

  const { trackConversions } = useConversionTracking(account.address) // only conversion tracking for EVM wallet

  const updateRecentConnectorId = useUpdateAtom(recentConnectorIdAtom)
  useEffect(() => {
    if (evmConnector) {
      updateRecentConnectorId(evmConnector.id)
    }
  }, [evmConnector, updateRecentConnectorId])

  /* Trace RPC calls (for debugging). */
  const shouldTrace = useFeatureFlag(FeatureFlags.TraceJsonRpc)
  const isSupportedChain = useIsSupportedChainId(account.chainId)
  const networkProvider = isSupportedChain && account.chainId ? RPC_PROVIDERS[account.chainId] : undefined
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

  const activeAddresses = useActiveAddresses()
  const evmWallet = useActiveWallet(Platform.EVM)
  const svmWallet = useActiveWallet(Platform.SVM)

  /* Log EVM chain changes */
  const accountEvmChainId = useAccountWagmi().chainId // Direct using wagmi's account hook so we can log analytics for the user's wallet's chainId even if user is connected to unsupported chain
  const previousConnectedEvmChainId = usePrevious(activeAddresses.evmAddress ? accountEvmChainId : undefined)
  useEffect(() => {
    const chainChanged =
      previousConnectedEvmChainId && accountEvmChainId && previousConnectedEvmChainId !== accountEvmChainId
    if (chainChanged) {
      if (activeAddresses.evmAddress && accountEvmChainId) {
        // Should also update user property for chain_id when user switches chains
        setUserProperty(InterfaceUserPropertyName.ChainId, accountEvmChainId)
        setUserProperty(InterfaceUserPropertyName.AllWalletChainIds, accountEvmChainId, true)
      }

      sendAnalyticsEvent(InterfaceEventName.ChainChanged, {
        result: WalletConnectionResult.Succeeded,
        wallet_address: activeAddresses.evmAddress,
        wallet_type: evmWallet?.analyticsWalletType ?? 'Network',
        chain_id: accountEvmChainId,
        previousConnectedChainId: previousConnectedEvmChainId,
        page: currentPage,
      })
    }
  }, [activeAddresses.evmAddress, accountEvmChainId, evmWallet, currentPage, previousConnectedEvmChainId])

  /* Send analytics events when the active account changes. */
  const previousActiveAddresses = usePrevious(activeAddresses)
  const { isConnecting: isConnectingEvm } = useConnectionStatus(Platform.EVM)
  const { isConnecting: isConnectingSvm } = useConnectionStatus(Platform.SVM)

  const updateWalletDisconnectionUserProperties = useEvent(
    (hasEVMDisconnection: boolean, hasSvmDisconnection: boolean) => {
      // Handle EVM disconnection - clear user properties
      if (hasEVMDisconnection) {
        setUserProperty(InterfaceUserPropertyName.WalletAddress, '')
        setUserProperty(InterfaceUserPropertyName.ChainId, '')
        setUserProperty(InterfaceUserPropertyName.WalletType, '')
        setUserProperty(InterfaceUserPropertyName.WalletName, '')
        setUserProperty(InterfaceUserPropertyName.WalletVersion, '')
        setUserProperty(InterfaceUserPropertyName.PeerWalletAgent, '')
      }

      // Handle SVM disconnection - clear user properties
      if (hasSvmDisconnection) {
        setUserProperty(InterfaceUserPropertyName.WalletAddressSVM, '')
        setUserProperty(InterfaceUserPropertyName.WalletTypeSVM, '')
        setUserProperty(InterfaceUserPropertyName.WalletNameSVM, '')
      }
    },
  )

  useEffect(() => {
    const currentEvmAddress = activeAddresses.evmAddress
    const currentSvmAddress = activeAddresses.svmAddress
    const previousEvmAddress = previousActiveAddresses?.evmAddress
    const previousSvmAddress = previousActiveAddresses?.svmAddress

    // Check if there's a wallet disconnection (address went from set to undefined)
    const hasEvmDisconnection = Boolean(previousEvmAddress && !currentEvmAddress)
    const hasSvmDisconnection = Boolean(previousSvmAddress && !currentSvmAddress)
    updateWalletDisconnectionUserProperties(hasEvmDisconnection, hasSvmDisconnection)

    // Check if there's a new wallet connection (new address on either platform)
    const hasNewEvmConnection = evmWallet && currentEvmAddress && currentEvmAddress !== previousEvmAddress
    const hasNewSvmConnection = svmWallet && currentSvmAddress && currentSvmAddress !== previousSvmAddress
    if (!hasNewEvmConnection && !hasNewSvmConnection) {
      return
    }

    const evmWalletName = evmWallet?.name ?? 'Network'

    // Check if this is a reconnect for either platform
    const isEvmReconnect = Boolean(currentEvmAddress && isConnectingEvm)
    const isSvmReconnect = Boolean(currentSvmAddress && isConnectingSvm)
    const isReconnect = isEvmReconnect || isSvmReconnect

    const walletConnectedProperties: WalletConnectedProperties = {
      result: WalletConnectionResult.Succeeded,
      wallet_address: undefined,
      wallet_address_svm: undefined,
      wallet_name: undefined,
      wallet_type: undefined,
      wallet_type_svm: undefined,
      wallet_name_svm: undefined,
      is_reconnect: isReconnect,
      peer_wallet_agent: undefined,
      page: currentPage,
      connected_VM:
        hasNewEvmConnection && hasNewSvmConnection
          ? 'EVM+SVM'
          : hasNewEvmConnection
            ? 'EVM'
            : hasNewSvmConnection
              ? 'SVM'
              : undefined,
    }

    // User properties *must* be set before sending corresponding event properties,
    // so that the event contains the correct and up-to-date user properties.

    // Set user/event properties for SVM account connected
    if (hasNewSvmConnection) {
      const walletNameSvm = svmWallet.name

      setUserProperty(InterfaceUserPropertyName.AllWalletChainIds, UniverseChainId.Solana, true)
      setUserProperty(InterfaceUserPropertyName.WalletAddressSVM, currentSvmAddress)
      setUserProperty(InterfaceUserPropertyName.AllSVMWalletAddressesConnected, currentSvmAddress, true)
      walletConnectedProperties.wallet_address_svm = currentSvmAddress

      setUserProperty(InterfaceUserPropertyName.WalletNameSVM, walletNameSvm)
      setUserProperty(InterfaceUserPropertyName.WalletTypeSVM, svmWallet.analyticsWalletType)
      walletConnectedProperties.wallet_name_svm = walletNameSvm
      walletConnectedProperties.wallet_type_svm = svmWallet.analyticsWalletType
    }

    // Set user/event properties for EVM account connected
    if (hasNewEvmConnection) {
      const peerWalletAgent = provider ? getWalletMeta(provider)?.agent : undefined
      walletConnectedProperties.peer_wallet_agent = peerWalletAgent

      if (accountEvmChainId) {
        setUserProperty(InterfaceUserPropertyName.ChainId, accountEvmChainId)
        setUserProperty(InterfaceUserPropertyName.AllWalletChainIds, accountEvmChainId, true)
      }
      setUserProperty(InterfaceUserPropertyName.WalletAddress, currentEvmAddress)
      setUserProperty(InterfaceUserPropertyName.AllWalletAddressesConnected, currentEvmAddress, true)
      walletConnectedProperties.wallet_address = currentEvmAddress

      walletConnectedProperties.wallet_name = evmWalletName

      setUserProperty(InterfaceUserPropertyName.WalletType, evmWallet.analyticsWalletType)
      walletConnectedProperties.wallet_type = evmWallet.analyticsWalletType

      // Get wallet version from EVM provider if available
      if (provider) {
        provider
          .send('web3_clientVersion', [])
          .then((clientVersion) => {
            setUserProperty(InterfaceUserPropertyName.WalletVersion, clientVersion)
          })
          .catch((error) => {
            logger.warn('WebAccountsStoreUpdater', 'Updater', 'Failed to get client version', error)
          })
      }

      if (evmWalletName === WalletType.WALLET_CONNECT) {
        try {
          evmConnector
            ?.getProvider()
            .then((externalProvider) => {
              const provider = externalProvider as ExternalProvider
              // Lookup metadata from the wallet connect external provider
              const meta = getWalletMeta(new EthersWeb3Provider(provider))
              const name = meta?.name ?? evmWalletName
              const agent = meta?.agent ?? peerWalletAgent

              setUserProperty(InterfaceUserPropertyName.WalletName, name)
              setUserProperty(InterfaceUserPropertyName.PeerWalletAgent, agent ?? '')

              // send here bc async
              sendAnalyticsEvent(InterfaceEventName.WalletConnected, {
                ...walletConnectedProperties,
                wallet_name: name,
                peer_wallet_agent: agent,
              })
            })
            .catch((error) => {
              logger.warn('WebAccountsStoreUpdater', 'Updater', 'Failed to get wallet connect metadata', error)
            })
        } catch (error) {
          logger.warn('WebAccountsStoreUpdater', 'Updater', 'Failed to call getProvider on WC connector', error)
        }
      } else {
        setUserProperty(InterfaceUserPropertyName.WalletName, evmWalletName)
        setUserProperty(InterfaceUserPropertyName.PeerWalletAgent, peerWalletAgent ?? '')
      }
    }

    // Send analytics event
    if (evmWalletName !== WalletType.WALLET_CONNECT) {
      sendAnalyticsEvent(InterfaceEventName.WalletConnected, walletConnectedProperties)
    }

    if (evmWalletName === CONNECTION_PROVIDER_NAMES.UNISWAP_EXTENSION) {
      trackConversions(CONVERSION_EVENTS.Extension.Downloaded)
    }

    trackConversions(CONVERSION_EVENTS.Web.WalletConnected)
  }, [
    activeAddresses.evmAddress,
    activeAddresses.svmAddress,
    previousActiveAddresses?.evmAddress,
    previousActiveAddresses?.svmAddress,
    accountEvmChainId,
    evmConnector,
    currentPage,
    isConnectingEvm,
    isConnectingSvm,
    provider,
    trackConversions,
    updateWalletDisconnectionUserProperties,
    evmWallet,
    svmWallet,
  ])

  return null
}

function trace(event: any) {
  if (!event?.request) {
    return
  }
  const { method, id, params } = event.request
  logger.debug('WebAccountsStoreUpdater', 'provider', 'trace', { method, id, params })
}
