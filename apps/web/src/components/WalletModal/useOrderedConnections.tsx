import { CONNECTION, useRecentConnectorId } from 'components/Web3Provider/constants'
import { useConnect } from 'hooks/useConnect'
import { useCallback, useMemo } from 'react'
import { isMobile, isTouchable, isWebAndroid, isWebIOS } from 'utilities/src/platform'
import { Connector } from 'wagmi'

type ConnectorID = (typeof CONNECTION)[keyof typeof CONNECTION]

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

function getInjectedConnectors(connectors: readonly Connector[], excludeUniswapConnections?: boolean) {
  let isCoinbaseWalletBrowser = false
  const injectedConnectors = connectors.filter((c) => {
    // Special-case: Ignore coinbase eip6963-injected connector; coinbase connection is handled via the SDK connector.
    if (c.id === CONNECTION.COINBASE_RDNS) {
      if (isMobile) {
        isCoinbaseWalletBrowser = true
      }
      return false
    }

    // Special-case: Ignore the Uniswap Extension injection here if it's being displayed separately.
    if (c.id === CONNECTION.UNISWAP_EXTENSION_RDNS && excludeUniswapConnections) {
      return false
    }

    return c.type === CONNECTION.INJECTED_CONNECTOR_TYPE && c.id !== CONNECTION.INJECTED_CONNECTOR_ID
  })

  // Special-case: Return deprecated window.ethereum connector when no eip6963 injectors are present.
  const fallbackInjector = getConnectorWithId(connectors, CONNECTION.INJECTED_CONNECTOR_ID, { shouldThrow: true })
  if (!injectedConnectors.length && Boolean(window.ethereum)) {
    return { injectedConnectors: [fallbackInjector], isCoinbaseWalletBrowser }
  }

  return { injectedConnectors, isCoinbaseWalletBrowser }
}

export function useOrderedConnections(excludeUniswapConnections?: boolean) {
  const { connectors } = useConnect()
  const recentConnectorId = useRecentConnectorId()

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
    const { injectedConnectors, isCoinbaseWalletBrowser } = getInjectedConnectors(connectors, excludeUniswapConnections)

    const coinbaseSdkConnector = getConnectorWithId(connectors, CONNECTION.COINBASE_SDK_CONNECTOR_ID, SHOULD_THROW)
    const walletConnectConnector = getConnectorWithId(connectors, CONNECTION.WALLET_CONNECT_CONNECTOR_ID, SHOULD_THROW)
    const uniswapWalletConnectConnector = getConnectorWithId(
      connectors,
      CONNECTION.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
      SHOULD_THROW,
    )
    if (!coinbaseSdkConnector || !walletConnectConnector || !uniswapWalletConnectConnector) {
      throw new Error('Expected connector(s) missing from wagmi context.')
    }

    // Special-case: Only display the injected connector for in-wallet browsers.
    if (isMobile && injectedConnectors.length === 1) {
      return injectedConnectors
    }

    // Special-case: Only display the Coinbase connector in the Coinbase Wallet.
    if (isCoinbaseWalletBrowser) {
      return [coinbaseSdkConnector]
    }

    const orderedConnectors: Connector[] = []
    const shouldDisplayUniswapWallet = !excludeUniswapConnections && (isWebIOS || isWebAndroid || !isTouchable)

    // Place the Uniswap Wallet at the top of the list by default.
    if (shouldDisplayUniswapWallet) {
      orderedConnectors.push(uniswapWalletConnectConnector)
    }

    // Injected connectors should appear next in the list, as the user intentionally installed/uses them.
    orderedConnectors.push(...injectedConnectors)

    // WalletConnect and Coinbase are added last in the list.
    orderedConnectors.push(walletConnectConnector)
    orderedConnectors.push(coinbaseSdkConnector)

    // Place the most recent connector at the top of the list.
    orderedConnectors.sort(sortByRecent)
    return orderedConnectors
  }, [connectors, excludeUniswapConnections, sortByRecent])
}

export enum ExtensionRequestMethods {
  OPEN_SIDEBAR = 'uniswap_openSidebar',
}

const ExtensionRequestArguments = {
  [ExtensionRequestMethods.OPEN_SIDEBAR]: ['Tokens', 'Activity'],
} as const

export function useUniswapExtensionConnector() {
  const connector = useConnectorWithId(CONNECTION.UNISWAP_EXTENSION_RDNS)
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
