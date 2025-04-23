import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useConnect } from 'hooks/useConnect'
import { useCallback, useMemo } from 'react'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isMobileWeb } from 'utilities/src/platform'
import { Connector } from 'wagmi'

export type ConnectorID = (typeof CONNECTION_PROVIDER_IDS)[keyof typeof CONNECTION_PROVIDER_IDS]

const SHOULD_THROW = { shouldThrow: true } as const

function getConnectorWithId(
  connectors: readonly Connector[],
  id: ConnectorID,
  options: { shouldThrow: true },
): Connector
function getConnectorWithId(connectors: readonly Connector[], id: ConnectorID): Connector | undefined
function getConnectorWithId(
  connectors: readonly Connector[],
  id: ConnectorID,
  options?: { shouldThrow: true },
): Connector | undefined {
  const connector = connectors.find((c) => c.id === id)
  if (!connector && options?.shouldThrow) {
    throw new Error(`Expected connector ${id} missing from wagmi context.`)
  }
  return connector
}

/** Returns a wagmi `Connector` with the given id. If `shouldThrow` is passed, an error will be thrown if the connector is not found. */
export function useConnectorWithId(id: ConnectorID, options: { shouldThrow: true }): Connector
export function useConnectorWithId(id: ConnectorID): Connector | undefined
export function useConnectorWithId(id: ConnectorID, options?: { shouldThrow: true }): Connector | undefined {
  const { connectors } = useConnect()
  return useMemo(
    () => (options?.shouldThrow ? getConnectorWithId(connectors, id, options) : getConnectorWithId(connectors, id)),
    [connectors, id, options],
  )
}

function getInjectedConnectors(connectors: readonly Connector[], isEmbeddedWalletEnabled?: boolean) {
  let isCoinbaseWalletBrowser = false
  const injectedConnectors = connectors.filter((c) => {
    // Special-case: Ignore coinbase eip6963-injected connector; coinbase connection is handled via the SDK connector.
    if (c.id === CONNECTION_PROVIDER_IDS.COINBASE_RDNS) {
      if (isMobileWeb) {
        isCoinbaseWalletBrowser = true
      }
      return false
    }

    // Special-case: Ignore the Uniswap Extension injection here if it's being displayed separately. This logic is updated with Embedded Wallet support where the Uniswap Extension is displayed with other connectors
    if (c.id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS && !isEmbeddedWalletEnabled) {
      return false
    }

    return (
      c.type === CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_TYPE &&
      c.id !== CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_ID
    )
  })

  // Special-case: Return deprecated window.ethereum connector when no eip6963 injectors are present.
  const fallbackInjector = getConnectorWithId(connectors, CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_ID, {
    shouldThrow: true,
  })
  if (!injectedConnectors.length && Boolean(window.ethereum)) {
    return { injectedConnectors: [fallbackInjector], isCoinbaseWalletBrowser }
  }

  return { injectedConnectors, isCoinbaseWalletBrowser }
}

/**
 * These connectors do not include Uniswap Wallets because those are
 * handled separately unless the embedded wallet is enabled. See <UniswapWalletOptions />
 * Primary connectors are displayed on the first page of the modal, this included injected connectors and recent connectors
 */
type InjectableConnector = Connector & { isInjected?: boolean }
export function useOrderedConnections(options?: { showSecondaryConnectors?: boolean }): InjectableConnector[] {
  const showSecondaryConnectors = options?.showSecondaryConnectors ?? false
  const { connectors } = useConnect()
  const recentConnectorId = useRecentConnectorId()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  const sortByRecent = useCallback(
    (a: Connector, b: Connector) => {
      if (a.id === recentConnectorId) {
        return -1
      } else if (b.id === recentConnectorId) {
        return 1
      } else {
        return 0
      }
    },
    [recentConnectorId],
  )

  return useMemo(() => {
    const { injectedConnectors: injectedConnectorsBase, isCoinbaseWalletBrowser } = getInjectedConnectors(
      connectors,
      isEmbeddedWalletEnabled,
    )
    const injectedConnectors = injectedConnectorsBase.map((c) => ({ ...c, isInjected: true }))

    const embeddedWalletConnector = getConnectorWithId(
      connectors,
      CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
      SHOULD_THROW,
    )
    const coinbaseSdkConnector = getConnectorWithId(
      connectors,
      CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
      SHOULD_THROW,
    )
    const walletConnectConnector = getConnectorWithId(
      connectors,
      CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
      SHOULD_THROW,
    )
    if (!coinbaseSdkConnector || !walletConnectConnector) {
      throw new Error('Expected connector(s) missing from wagmi context.')
    }

    if (isPlaywrightEnv()) {
      const mockConnector = getConnectorWithId(connectors, CONNECTION_PROVIDER_IDS.MOCK_CONNECTOR_ID, SHOULD_THROW)
      return [mockConnector]
    }

    // Special-case: Only display the injected connector for in-wallet browsers.
    if (isMobileWeb && injectedConnectors.length === 1) {
      return injectedConnectors
    }

    // Special-case: Only display the Coinbase connector in the Coinbase Wallet.
    if (isCoinbaseWalletBrowser) {
      return [coinbaseSdkConnector]
    }

    const orderedConnectors: InjectableConnector[] = []

    // Injected connectors should appear next in the list, as the user intentionally installed/uses them.
    if (showSecondaryConnectors) {
      const secondaryConnectors = [walletConnectConnector, coinbaseSdkConnector]
      // Recent connector should have already been shown on the primary page
      orderedConnectors.push(...secondaryConnectors.filter((c) => c.id !== recentConnectorId))
    } else {
      orderedConnectors.push(...injectedConnectors)
      // If embedded wallet is enabled, add it to the top of the list
      // Else we don't care about the primary/secondary split so show mobile connectors
      if (isEmbeddedWalletEnabled) {
        orderedConnectors.push(embeddedWalletConnector)
        // If used recently, still add mobile wallets to primary
        if (recentConnectorId === CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID) {
          orderedConnectors.push(coinbaseSdkConnector)
        } else if (recentConnectorId === CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID) {
          orderedConnectors.push(walletConnectConnector)
        }
      } else {
        orderedConnectors.push(walletConnectConnector)
        orderedConnectors.push(coinbaseSdkConnector)
      }
    }

    // Place the most recent connector at the top of the list.
    orderedConnectors.sort(sortByRecent)
    return orderedConnectors
  }, [connectors, isEmbeddedWalletEnabled, recentConnectorId, showSecondaryConnectors, sortByRecent])
}

export enum ExtensionRequestMethods {
  OPEN_SIDEBAR = 'uniswap_openSidebar',
}

const ExtensionRequestArguments = {
  [ExtensionRequestMethods.OPEN_SIDEBAR]: ['Tokens', 'Activity'],
} as const

export function useUniswapExtensionConnector() {
  const connector = useConnectorWithId(CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS)
  const extensionRequest = useCallback(
    async <
      Type extends keyof typeof ExtensionRequestArguments,
      Key extends (typeof ExtensionRequestArguments)[Type][number],
    >(
      method: Type,
      arg: Key,
    ) => {
      const provider = (await connector?.getProvider()) as {
        request?: (params: { method: Type; params: Key[] }) => Promise<void>
      }
      if (!provider.request) {
        return
      }

      await provider.request({
        method,
        params: [arg],
      })
    },
    [connector],
  )

  return useMemo(() => {
    return connector ? { ...connector, extensionRequest } : undefined
  }, [connector, extensionRequest])
}
