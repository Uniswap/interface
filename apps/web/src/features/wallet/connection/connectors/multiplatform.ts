import { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { logger } from 'utilities/src/logger/logger'

const NORMALIZATION_RULES = [
  // Convert to lowercase
  (name: string) => name.toLowerCase(),
  // Remove "Wallet" from the end of the `name`, for cases like "Phantom" being used as an eip6963/wagmi name while Solana utils use the `name` "Phantom Wallet"
  (name: string) => name.replace(/ wallet$/, ''),
]

export function normalizeWalletName(name: string) {
  return NORMALIZATION_RULES.reduce((name, rule) => rule(name), name)
}

/**
 * Merges wallet connectors into a single wallet connector, preferring the values from the first wallet connector.
 * @param walletConnectors - The wallet connectors to merge.
 * @returns A new wallet connector that represents the same wallet on multiple platforms.
 *
 * @example
 * const walletConnectorMeta1 = { name: 'Phantom', wagmi: { id: 'phantom', type: 'injected' }, isInjected: true  }
 * const walletConnectorMeta2 = { name: 'Phantom Wallet', solana: { walletName: 'Phantom Wallet' }, icon: 'https://icon.com', isInjected: true  }
 * const mergedWalletConnectorMeta = mergeWalletConnectorMeta(walletConnectorMeta1, walletConnectorMeta2)
 * // mergedWalletConnectorMeta = { name: 'Phantom', wagmi: { id: 'phantom', type: 'injected' }, solana: { walletName: 'Phantom Wallet' }, icon: 'https://icon.com', isInjected: true  }
 */
function mergeWalletConnectorMeta(
  ...walletConnectors: [WalletConnectorMeta, WalletConnectorMeta, ...WalletConnectorMeta[]]
): WalletConnectorMeta {
  const [firstWalletConnector, ...restWalletConnectors] = walletConnectors

  // Use the first wallet connector as the base, and merge the rest of the wallet connectors into it
  const mergedWalletConnector = restWalletConnectors.reduce((acc, walletConnector) => {
    if (acc.isInjected !== walletConnector.isInjected) {
      logger.warn(
        'wallet/connectors/multiplatform.ts',
        'mergeWalletConnectorMeta',
        'walletConnector isInjected mismatch',
        {
          acc,
          walletConnector,
        },
      )
    }
    return { ...walletConnector, ...acc, icon: acc.icon ?? walletConnector.icon }
  }, firstWalletConnector)

  return mergedWalletConnector
}

/** Checks if two wallet connector meta objects can be merged, based on whether one has a solana wallet name and the other has a wagmi connector id. */
function areConnectorsOnDifferentPlatforms(connector1: WalletConnectorMeta, connector2: WalletConnectorMeta): boolean {
  return (
    Boolean(connector1.solana?.walletName) !== Boolean(connector2.solana?.walletName) &&
    Boolean(connector1.wagmi?.id) !== Boolean(connector2.wagmi?.id)
  )
}

function shouldMergeConnectors(
  connectors: [WalletConnectorMeta, WalletConnectorMeta, ...WalletConnectorMeta[]],
): boolean {
  const [connector1, connector2] = connectors
  return (
    connectors.length === 2 && // Only merge 2 connectors -- if more than 2 have the same name, behavior is unpredictable and none should be merged.
    areConnectorsOnDifferentPlatforms(connectors[0], connectors[1]) &&
    connector1.customConnectorId === undefined && // Connectors with custom connector should not be merged.
    connector2.customConnectorId === undefined
  )
}

/** Merges 2 connectors if they are on different platforms and have no custom connector id, otherwise returns `connectors` as is. */
function getMergedConnectors(connectors: WalletConnectorMeta[]): WalletConnectorMeta[] {
  const [connector1, connector2, ...rest] = connectors
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (connector1 && connector2 && shouldMergeConnectors([connector1, connector2, ...rest])) {
    return [mergeWalletConnectorMeta(connector1, connector2)]
  }
  return connectors
}

/**
 * Merges wallet connectors with the same name into a single wallet connector.
 * @param walletConnectors - The wallet connectors to merge.
 * @returns A new wallet connector that represents the same wallet on multiple platforms.
 */
export function deduplicateWalletConnectorMeta(walletConnectorMeta: WalletConnectorMeta[]): WalletConnectorMeta[] {
  const keyToConnectorsMap = new Map<string, WalletConnectorMeta[]>()

  for (const connector of walletConnectorMeta) {
    // Use name as key, as solana wallet names do not have ids or rdns
    const key = normalizeWalletName(connector.name)
    const existing = keyToConnectorsMap.get(key) ?? []
    keyToConnectorsMap.set(key, [...existing, connector])
  }

  const deduplicatedConnectors: WalletConnectorMeta[] = []
  for (const connectors of keyToConnectorsMap.values()) {
    deduplicatedConnectors.push(...getMergedConnectors(connectors))
  }

  return deduplicatedConnectors
}
