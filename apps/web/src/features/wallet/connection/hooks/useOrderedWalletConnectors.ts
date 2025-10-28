import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useAccountsStore } from 'features/accounts/store/hooks'
import { ExternalWallet } from 'features/accounts/store/types'
import { useConnectWallet } from 'features/wallet/connection/hooks/useConnectWallet'
import { useCallback, useMemo } from 'react'
import { CONNECTION_PROVIDER_IDS, CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'
import { AccessPattern } from 'uniswap/src/features/accounts/store/types/Connector'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isMobileWeb } from 'utilities/src/platform'

type WalletWithInjectedStatus = ExternalWallet & { injected: boolean }

// TODO(SWAP-538): Simplify this hook
function useFilteredWalletsWithInjectedInfo({
  platformFilter,
}: {
  platformFilter: Platform | 'any'
}): WalletWithInjectedStatus[] {
  const { pendingWallet } = useConnectWallet()
  const activeWalletIds = useAccountsStore((state) => ({
    [Platform.EVM]: state.getActiveWallet(Platform.EVM)?.id,
    [Platform.SVM]: state.getActiveWallet(Platform.SVM)?.id,
  }))
  const wallets = useAccountsStore((state) => Object.values(state.wallets))
  const connectors = useAccountsStore((state) => state.connectors)

  return useMemo(() => {
    return wallets.flatMap((wallet) => {
      // If this wallet is the active wallet for the current platform that is being filtered for, don't show it
      const activeWalletAlreadyConnectedOnPlatform =
        platformFilter !== 'any' && activeWalletIds[platformFilter] === wallet.id

      // If this wallet is active and no platform is being filtered for, don't show it
      const activeWalletAlreadyConnectedMultiPlatform =
        platformFilter === 'any' &&
        (activeWalletIds[Platform.EVM] === wallet.id || activeWalletIds[Platform.SVM] === wallet.id)

      // Always show the pending wallet, to avoid hiding it during multi-platform connection
      const isPendingWallet = pendingWallet?.id === wallet.id

      if (!isPendingWallet && (activeWalletAlreadyConnectedOnPlatform || activeWalletAlreadyConnectedMultiPlatform)) {
        return []
      }

      const evmConnectorId = wallet.connectorIds[Platform.EVM]
      const evmConnector = evmConnectorId ? connectors[evmConnectorId] : undefined
      const svmConnectorId = wallet.connectorIds[Platform.SVM]
      const svmConnector = svmConnectorId ? connectors[svmConnectorId] : undefined

      if (platformFilter === Platform.EVM && !evmConnector) {
        return []
      }

      if (platformFilter === Platform.SVM && !svmConnector) {
        return []
      }

      const injected =
        evmConnector?.access === AccessPattern.Injected || svmConnector?.access === AccessPattern.Injected

      return { ...wallet, injected }
    })
  }, [wallets, platformFilter, activeWalletIds, pendingWallet?.id, connectors])
}

/**
 * Gets an ExternalWallet by its connector ID from a list of wallets.
 */
function getWalletWithId(wallets: WalletWithInjectedStatus[], id: string): WalletWithInjectedStatus | undefined {
  return wallets.find((wallet) => wallet.id === id)
}

function getInjectedConnectors({
  wallets,
  isEmbeddedWalletEnabled,
}: {
  wallets: WalletWithInjectedStatus[]
  isEmbeddedWalletEnabled: boolean
}): WalletWithInjectedStatus[] {
  return wallets.filter((wallet) => {
    if (
      wallet.id === CONNECTION_PROVIDER_IDS.COINBASE_RDNS ||
      wallet.name === CONNECTION_PROVIDER_NAMES.COINBASE_SOLANA_WALLET_ADAPTER
    ) {
      // Special-case: Ignore coinbase eip6963-injected connector and coinbase solana wallet adapter; CB is selected separately / not treated as an injector since it can always be accessed via the CB SDK connector.
      return false
    } else if (wallet.id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS && !isEmbeddedWalletEnabled) {
      // Special-case: Ignore the Uniswap Extension injection here if it's being displayed separately. This logic is updated with Embedded Wallet support where the Uniswap Extension is displayed with other connectors
      return false
    } else if (wallet.id === CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID) {
      // Porto is also surfacing from the injected connectors list, but we don't want to show it in the wallet modal as a detected wallet
      return false
    }
    return wallet.injected
  })
}

function useSortByRecent(recentConnectorId: string | undefined) {
  return useCallback(
    (a: ExternalWallet, b: ExternalWallet) => {
      if (!recentConnectorId) {
        return 0
      }
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
}

function isCoinbaseWalletBrowser(wallets: ExternalWallet[]): boolean {
  return (
    isMobileWeb &&
    wallets.some(
      (wallet) => wallet.connectorIds[Platform.EVM] === `WagmiConnector_${CONNECTION_PROVIDER_IDS.COINBASE_RDNS}`,
    )
  )
}

function isBinanceWalletBrowser(wallets: ExternalWallet[]): boolean {
  return (
    isMobileWeb &&
    wallets.some(
      (wallet) => wallet.connectorIds[Platform.EVM] === `WagmiConnector_${CONNECTION_PROVIDER_IDS.BINANCE_WALLET_RDNS}`,
    )
  )
}

function shouldShowOnlyInjectedConnector(injectedWallets: ExternalWallet[]): boolean {
  return isMobileWeb && injectedWallets.length === 1
}

function buildSecondaryConnectorsList({
  isMobileWeb,
  isEmbeddedWalletEnabled,
  walletConnectWallet,
  coinbaseSdkWallet,
  embeddedWalletWallet,
  binanceWalletWallet,
  portoWalletWallet,
  recentConnectorId,
}: {
  isMobileWeb: boolean
  isEmbeddedWalletEnabled: boolean
  walletConnectWallet?: ExternalWallet
  coinbaseSdkWallet?: ExternalWallet
  embeddedWalletWallet?: ExternalWallet
  binanceWalletWallet?: ExternalWallet
  portoWalletWallet?: ExternalWallet
  recentConnectorId?: string
}): ExternalWallet[] {
  const orderedWallets: ExternalWallet[] = []

  if (isMobileWeb) {
    isEmbeddedWalletEnabled && embeddedWalletWallet && orderedWallets.push(embeddedWalletWallet)
    walletConnectWallet && orderedWallets.push(walletConnectWallet)
    coinbaseSdkWallet && orderedWallets.push(coinbaseSdkWallet)
    binanceWalletWallet && orderedWallets.push(binanceWalletWallet)
    portoWalletWallet && orderedWallets.push(portoWalletWallet)
  } else {
    const secondaryWallets = [walletConnectWallet, coinbaseSdkWallet, binanceWalletWallet, portoWalletWallet].filter(
      (w): w is ExternalWallet => Boolean(w),
    )
    // Recent connector should have already been shown on the primary page
    orderedWallets.push(...secondaryWallets.filter((w) => !recentConnectorId || w.id !== recentConnectorId))
  }

  return orderedWallets
}

function buildPrimaryConnectorsList({
  injectedWallets,
  isEmbeddedWalletEnabled,
  walletConnectWallet,
  coinbaseSdkWallet,
  embeddedWalletWallet,
  binanceWalletWallet,
  portoWalletWallet,
  recentConnectorId,
}: {
  injectedWallets: ExternalWallet[]
  isEmbeddedWalletEnabled: boolean
  walletConnectWallet?: ExternalWallet
  coinbaseSdkWallet?: ExternalWallet
  embeddedWalletWallet?: ExternalWallet // only undefined if embedded wallet is disabled
  binanceWalletWallet?: ExternalWallet // undefined if using injected connector from binance browser
  portoWalletWallet?: ExternalWallet
  recentConnectorId?: string
}): ExternalWallet[] {
  const orderedWallets: ExternalWallet[] = []

  orderedWallets.push(...injectedWallets)
  // If embedded wallet is enabled, add it to the top of the list
  // Else we don't care about the primary/secondary split so show mobile connectors
  if (isEmbeddedWalletEnabled && embeddedWalletWallet) {
    orderedWallets.push(embeddedWalletWallet)
    // If used recently, still add mobile wallets to primary
    if (recentConnectorId === CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID) {
      coinbaseSdkWallet && orderedWallets.push(coinbaseSdkWallet)
    } else if (recentConnectorId === CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID) {
      walletConnectWallet && orderedWallets.push(walletConnectWallet)
    } else if (recentConnectorId === CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID && binanceWalletWallet) {
      orderedWallets.push(binanceWalletWallet)
    } else if (recentConnectorId === CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID && portoWalletWallet) {
      orderedWallets.push(portoWalletWallet)
    }
  } else {
    walletConnectWallet && orderedWallets.push(walletConnectWallet)
    coinbaseSdkWallet && orderedWallets.push(coinbaseSdkWallet)
    binanceWalletWallet && orderedWallets.push(binanceWalletWallet)
    portoWalletWallet && orderedWallets.push(portoWalletWallet)
  }

  return orderedWallets
}

/**
 * These wallets do not include Uniswap Wallets because those are
 * handled separately unless the embedded wallet is enabled. See <UniswapWalletOptions />
 * Primary wallets are displayed on the first page of the modal, this included injected wallets and recent wallets
 */
export function useOrderedWallets({
  showSecondaryConnectors,
  platformFilter = 'any',
}: {
  showSecondaryConnectors: boolean
  platformFilter?: Platform | 'any'
}): ExternalWallet[] {
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const isPortoWalletConnectorEnabled = useFeatureFlag(FeatureFlags.PortoWalletConnector)

  const wallets = useFilteredWalletsWithInjectedInfo({
    platformFilter,
  })

  const recentConnectorId = useRecentConnectorId()

  const sortByRecent = useSortByRecent(recentConnectorId)

  return useMemo(() => {
    const injectedWallets = getInjectedConnectors({
      wallets,
      isEmbeddedWalletEnabled,
    })
    const isBinanceBrowser = isBinanceWalletBrowser(wallets)
    const embeddedWalletWallet = isEmbeddedWalletEnabled
      ? getWalletWithId(wallets, CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID)
      : undefined
    const coinbaseSdkWallet = getWalletWithId(wallets, CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID)
    const walletConnectWallet = getWalletWithId(wallets, CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
    const binanceWalletWallet = isBinanceBrowser
      ? undefined
      : getWalletWithId(wallets, CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID)
    const portoWalletWallet = isPortoWalletConnectorEnabled
      ? getWalletWithId(wallets, CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID)
      : undefined

    if (isPlaywrightEnv()) {
      const mockWallet = getWalletWithId(wallets, CONNECTION_PROVIDER_IDS.MOCK_CONNECTOR_ID)
      if (!mockWallet) {
        throw new Error('Mock wallet not found')
      }
      return [mockWallet]
    }

    // Special-case: Only display the Coinbase wallet in the Coinbase Wallet.
    if (isCoinbaseWalletBrowser(wallets)) {
      if (!coinbaseSdkWallet) {
        throw new Error('Coinbase SDK wallet not found')
      }
      return [coinbaseSdkWallet]
    }

    // Special-case: Only display the injected wallet for in-wallet browsers.
    if (shouldShowOnlyInjectedConnector(injectedWallets)) {
      return injectedWallets
    }

    let orderedWallets: ExternalWallet[]

    if (showSecondaryConnectors) {
      orderedWallets = buildSecondaryConnectorsList({
        isMobileWeb,
        isEmbeddedWalletEnabled,
        walletConnectWallet,
        coinbaseSdkWallet,
        embeddedWalletWallet,
        binanceWalletWallet,
        portoWalletWallet,
        recentConnectorId,
      })
    } else {
      orderedWallets = buildPrimaryConnectorsList({
        injectedWallets,
        isEmbeddedWalletEnabled,
        walletConnectWallet,
        coinbaseSdkWallet,
        embeddedWalletWallet,
        binanceWalletWallet,
        portoWalletWallet,
        recentConnectorId,
      })
    }

    // Move the most recent wallet to the top of the list.
    orderedWallets.sort(sortByRecent)

    return orderedWallets
  }, [
    wallets,
    isEmbeddedWalletEnabled,
    isPortoWalletConnectorEnabled,
    recentConnectorId,
    showSecondaryConnectors,
    sortByRecent,
  ])
}
