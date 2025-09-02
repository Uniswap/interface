import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useWalletConnectors } from 'features/wallet/connection/hooks/useWalletConnectors'
import { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { getConnectorWithIdWithThrow, isEqualWalletConnectorMetaId } from 'features/wallet/connection/utils'
import { useCallback, useMemo } from 'react'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isMobileWeb } from 'utilities/src/platform'

function getInjectedConnectors({
  connectors,
  isEmbeddedWalletEnabled,
}: {
  connectors: WalletConnectorMeta[]
  isEmbeddedWalletEnabled: boolean
}) {
  return connectors.filter((c) => {
    if (c.wagmi?.id === CONNECTION_PROVIDER_IDS.COINBASE_RDNS) {
      // Special-case: Ignore coinbase eip6963-injected connector; coinbase connection is handled via the SDK connector.
      return false
    } else if (c.wagmi?.id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS && !isEmbeddedWalletEnabled) {
      // Special-case: Ignore the Uniswap Extension injection here if it's being displayed separately. This logic is updated with Embedded Wallet support where the Uniswap Extension is displayed with other connectors
      return false
    }
    return c.isInjected
  })
}

function useSortByRecent(recentConnectorId: string | undefined) {
  return useCallback(
    (a: WalletConnectorMeta, b: WalletConnectorMeta) => {
      if (!recentConnectorId) {
        return 0
      }
      if (isEqualWalletConnectorMetaId(a, recentConnectorId)) {
        return -1
      } else if (isEqualWalletConnectorMetaId(b, recentConnectorId)) {
        return 1
      } else {
        return 0
      }
    },
    [recentConnectorId],
  )
}

function isCoinbaseWalletBrowser(connectors: WalletConnectorMeta[]): boolean {
  return isMobileWeb && connectors.some((c) => c.wagmi?.id === CONNECTION_PROVIDER_IDS.COINBASE_RDNS)
}

function isBinanceWalletBrowser(connectors: WalletConnectorMeta[]): boolean {
  return isMobileWeb && connectors.some((c) => c.wagmi?.id === CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS)
}

function shouldShowOnlyInjectedConnector(injectedConnectors: WalletConnectorMeta[]): boolean {
  return isMobileWeb && injectedConnectors.length === 1
}

function buildSecondaryConnectorsList({
  isMobileWeb,
  isEmbeddedWalletEnabled,
  walletConnectConnector,
  coinbaseSdkConnector,
  embeddedWalletConnector,
  binanceWalletConnector,
  recentConnectorId,
}: {
  isMobileWeb: boolean
  isEmbeddedWalletEnabled: boolean
  walletConnectConnector: WalletConnectorMeta
  coinbaseSdkConnector: WalletConnectorMeta
  embeddedWalletConnector: WalletConnectorMeta | undefined // only undefined if embedded wallet is disabled
  binanceWalletConnector: WalletConnectorMeta | undefined // undefined if using injected connector from binance browser
  recentConnectorId: string | undefined
}): WalletConnectorMeta[] {
  const orderedConnectors: WalletConnectorMeta[] = []

  if (isMobileWeb) {
    isEmbeddedWalletEnabled && embeddedWalletConnector && orderedConnectors.push(embeddedWalletConnector)
    orderedConnectors.push(walletConnectConnector)
    orderedConnectors.push(coinbaseSdkConnector)
    binanceWalletConnector && orderedConnectors.push(binanceWalletConnector)
  } else {
    const secondaryConnectors = [walletConnectConnector, coinbaseSdkConnector, binanceWalletConnector].filter(
      (c): c is WalletConnectorMeta => Boolean(c),
    )
    // Recent connector should have already been shown on the primary page
    orderedConnectors.push(
      ...secondaryConnectors.filter((c) => !recentConnectorId || !isEqualWalletConnectorMetaId(c, recentConnectorId)),
    )
  }

  return orderedConnectors
}

function buildPrimaryConnectorsList({
  injectedConnectors,
  isEmbeddedWalletEnabled,
  walletConnectConnector,
  coinbaseSdkConnector,
  embeddedWalletConnector,
  binanceWalletConnector,
  recentConnectorId,
}: {
  injectedConnectors: WalletConnectorMeta[]
  isEmbeddedWalletEnabled: boolean
  walletConnectConnector: WalletConnectorMeta
  coinbaseSdkConnector: WalletConnectorMeta
  embeddedWalletConnector: WalletConnectorMeta | undefined // only undefined if embedded wallet is disabled
  binanceWalletConnector: WalletConnectorMeta | undefined // undefined if using injected connector from binance browser
  recentConnectorId: string | undefined
}): WalletConnectorMeta[] {
  const orderedConnectors: WalletConnectorMeta[] = []

  orderedConnectors.push(...injectedConnectors)
  // If embedded wallet is enabled, add it to the top of the list
  // Else we don't care about the primary/secondary split so show mobile connectors
  if (isEmbeddedWalletEnabled && embeddedWalletConnector) {
    orderedConnectors.push(embeddedWalletConnector)
    // If used recently, still add mobile wallets to primary
    if (recentConnectorId === CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID) {
      orderedConnectors.push(coinbaseSdkConnector)
    } else if (recentConnectorId === CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID) {
      orderedConnectors.push(walletConnectConnector)
    } else if (recentConnectorId === CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID && binanceWalletConnector) {
      orderedConnectors.push(binanceWalletConnector)
    }
  } else {
    orderedConnectors.push(walletConnectConnector)
    orderedConnectors.push(coinbaseSdkConnector)
    binanceWalletConnector && orderedConnectors.push(binanceWalletConnector)
  }

  return orderedConnectors
}

/**
 * These connectors do not include Uniswap Wallets because those are
 * handled separately unless the embedded wallet is enabled. See <UniswapWalletOptions />
 * Primary connectors are displayed on the first page of the modal, this included injected connectors and recent connectors
 */
export function useOrderedWalletConnectors({
  showSecondaryConnectors,
}: {
  showSecondaryConnectors: boolean
}): WalletConnectorMeta[] {
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  const connectors = useWalletConnectors()
  const recentConnectorId = useRecentConnectorId()

  const sortByRecent = useSortByRecent(recentConnectorId)

  return useMemo(() => {
    const injectedConnectors = getInjectedConnectors({
      connectors,
      isEmbeddedWalletEnabled,
    })
    const isBinanceBrowser = isBinanceWalletBrowser(connectors)
    const embeddedWalletConnector = isEmbeddedWalletEnabled
      ? getConnectorWithIdWithThrow({
          connectors,
          id: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
        })
      : undefined
    const coinbaseSdkConnector = getConnectorWithIdWithThrow({
      connectors,
      id: CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID,
    })
    const walletConnectConnector = getConnectorWithIdWithThrow({
      connectors,
      id: CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID,
    })
    const binanceWalletConnector = isBinanceBrowser
      ? undefined
      : getConnectorWithIdWithThrow({
          connectors,
          id: CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID,
        })

    if (isPlaywrightEnv()) {
      const mockConnector = getConnectorWithIdWithThrow({
        connectors,
        id: CONNECTION_PROVIDER_IDS.MOCK_CONNECTOR_ID,
      })
      return [mockConnector]
    }

    // Special-case: Only display the Coinbase connector in the Coinbase Wallet.
    if (isCoinbaseWalletBrowser(connectors)) {
      return [coinbaseSdkConnector]
    }

    // Special-case: Only display the injected connector for in-wallet browsers.
    if (shouldShowOnlyInjectedConnector(injectedConnectors)) {
      return injectedConnectors
    }

    let orderedConnectors: WalletConnectorMeta[]

    if (showSecondaryConnectors) {
      orderedConnectors = buildSecondaryConnectorsList({
        isMobileWeb,
        isEmbeddedWalletEnabled,
        walletConnectConnector,
        coinbaseSdkConnector,
        embeddedWalletConnector,
        binanceWalletConnector,
        recentConnectorId,
      })
    } else {
      orderedConnectors = buildPrimaryConnectorsList({
        injectedConnectors,
        isEmbeddedWalletEnabled,
        walletConnectConnector,
        coinbaseSdkConnector,
        embeddedWalletConnector,
        binanceWalletConnector,
        recentConnectorId,
      })
    }

    // Move the most recent connector to the top of the list.
    orderedConnectors.sort(sortByRecent)

    return orderedConnectors
  }, [connectors, isEmbeddedWalletEnabled, recentConnectorId, showSecondaryConnectors, sortByRecent])
}
