import { isMobileWeb, isE2eTestEnv } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { CONNECTION_PROVIDER_IDS, CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'
import { AccessPattern } from 'uniswap/src/features/accounts/store/types/Connector'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useRecentConnectorId } from '~/connection/constants'
import { useAccountsStore } from '~/features/accounts/store/hooks'
import { ExternalWallet } from '~/features/accounts/store/types'
import { useConnectWallet } from '~/features/wallet/connection/hooks/useConnectWallet'
import { useIsMetaMaskExtensionDetected } from '~/features/wallet/connection/hooks/useIsMetaMaskExtensionDetected'

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
  isMetaMaskExtensionDetected,
}: {
  wallets: WalletWithInjectedStatus[]
  isEmbeddedWalletEnabled: boolean
  isMetaMaskExtensionDetected: boolean
}): WalletWithInjectedStatus[] {
  return wallets
    .filter((wallet) => {
      if (
        wallet.id === CONNECTION_PROVIDER_IDS.COINBASE_RDNS ||
        wallet.name === CONNECTION_PROVIDER_NAMES.COINBASE_SOLANA_WALLET_ADAPTER
      ) {
        // Special-case: Ignore coinbase eip6963-injected connector and coinbase solana wallet adapter; CB is selected separately / not treated as an injector since it can always be accessed via the CB SDK connector.
        return false
      } else if (wallet.id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS && !isEmbeddedWalletEnabled) {
        // Special-case: Ignore the Uniswap Extension injection here if it's being displayed separately. This logic is updated with Embedded Wallet support where the Uniswap Extension is displayed with other connectors
        return false
      } else if (wallet.id === CONNECTION_PROVIDER_IDS.METAMASK_SDK_CONNECTOR_ID) {
        // SDK connector (not flagged injected); only surface it in the primary list when the extension is detected.
        return isMetaMaskExtensionDetected
      }
      return wallet.injected
    })
    .sort((a, b) => {
      // prioritize uniswap extension over other injected connectors
      if (a.id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS) {
        return -1
      } else if (b.id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS) {
        return 1
      } else {
        return 0
      }
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
  // oxlint-disable-next-line no-shadow
  isMobileWeb,
  walletConnectWallet,
  metaMaskWallet,
  coinbaseSdkWallet,
  binanceWalletWallet,
  recentConnectorId,
}: {
  isMobileWeb: boolean
  walletConnectWallet?: ExternalWallet
  metaMaskWallet?: ExternalWallet
  coinbaseSdkWallet?: ExternalWallet
  binanceWalletWallet?: ExternalWallet
  recentConnectorId?: string
}): ExternalWallet[] {
  const orderedWallets: ExternalWallet[] = []

  if (isMobileWeb) {
    walletConnectWallet && orderedWallets.push(walletConnectWallet)
    metaMaskWallet && orderedWallets.push(metaMaskWallet)
    coinbaseSdkWallet && orderedWallets.push(coinbaseSdkWallet)
    binanceWalletWallet && orderedWallets.push(binanceWalletWallet)
  } else {
    const secondaryWallets = [walletConnectWallet, metaMaskWallet, coinbaseSdkWallet, binanceWalletWallet].filter(
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
  metaMaskWallet,
  coinbaseSdkWallet,
  binanceWalletWallet,
  recentConnectorId,
}: {
  injectedWallets: ExternalWallet[]
  isEmbeddedWalletEnabled: boolean
  walletConnectWallet?: ExternalWallet
  metaMaskWallet?: ExternalWallet
  coinbaseSdkWallet?: ExternalWallet
  binanceWalletWallet?: ExternalWallet // undefined if using injected connector from binance browser
  recentConnectorId?: string
}): ExternalWallet[] {
  const orderedWallets: ExternalWallet[] = []

  orderedWallets.push(...injectedWallets)
  // If embedded wallet is enabled, only add non-injected wallet if it was recently used (last-used position 2)
  // Else we don't care about the primary/secondary split so show mobile connectors
  if (isEmbeddedWalletEnabled) {
    if (recentConnectorId === CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID) {
      coinbaseSdkWallet && orderedWallets.push(coinbaseSdkWallet)
    } else if (recentConnectorId === CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID) {
      walletConnectWallet && orderedWallets.push(walletConnectWallet)
    } else if (recentConnectorId === CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID && binanceWalletWallet) {
      orderedWallets.push(binanceWalletWallet)
    }
  } else {
    walletConnectWallet && orderedWallets.push(walletConnectWallet)
    metaMaskWallet && orderedWallets.push(metaMaskWallet)
    coinbaseSdkWallet && orderedWallets.push(coinbaseSdkWallet)
    binanceWalletWallet && orderedWallets.push(binanceWalletWallet)
  }

  return orderedWallets
}

/**
 * Returns whether any third-party injected wallets (e.g. MetaMask) are detected.
 * Excludes Coinbase (accessed via SDK) and, when embedded wallet is disabled, Uniswap Extension.
 */
export function useHasInjectedWallets(): boolean {
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const isMetaMaskExtensionDetected = useIsMetaMaskExtensionDetected()
  const wallets = useFilteredWalletsWithInjectedInfo({ platformFilter: 'any' })

  return useMemo(() => {
    return getInjectedConnectors({ wallets, isEmbeddedWalletEnabled, isMetaMaskExtensionDetected }).length > 0
  }, [wallets, isEmbeddedWalletEnabled, isMetaMaskExtensionDetected])
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
  const isMetaMaskExtensionDetected = useIsMetaMaskExtensionDetected()

  const wallets = useFilteredWalletsWithInjectedInfo({
    platformFilter,
  })

  const recentConnectorId = useRecentConnectorId()

  const sortByRecent = useSortByRecent(recentConnectorId)

  return useMemo(() => {
    const injectedWallets = getInjectedConnectors({
      wallets,
      isEmbeddedWalletEnabled,
      isMetaMaskExtensionDetected,
    })
    const isBinanceBrowser = isBinanceWalletBrowser(wallets)
    const coinbaseSdkWallet = getWalletWithId(wallets, CONNECTION_PROVIDER_IDS.COINBASE_SDK_CONNECTOR_ID)
    const walletConnectWallet = getWalletWithId(wallets, CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
    const binanceWalletWallet = isBinanceBrowser
      ? undefined
      : getWalletWithId(wallets, CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID)

    // When the extension isn't detected, the MetaMask Connect SDK connector isn't in the injected
    // (primary) list; surface it as an SDK option (QR on desktop, deeplink on mobile) like the others.
    const metaMaskWallet = isMetaMaskExtensionDetected
      ? undefined
      : getWalletWithId(wallets, CONNECTION_PROVIDER_IDS.METAMASK_SDK_CONNECTOR_ID)

    if (isE2eTestEnv()) {
      const mockWallet = getWalletWithId(wallets, CONNECTION_PROVIDER_IDS.MOCK_CONNECTOR_ID)
      // Return mock wallet if found, otherwise return empty array
      // Tests auto-connect so the wallet selector isn't needed
      return mockWallet ? [mockWallet] : []
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
        walletConnectWallet,
        metaMaskWallet,
        coinbaseSdkWallet,
        binanceWalletWallet,
        recentConnectorId,
      })
    } else {
      orderedWallets = buildPrimaryConnectorsList({
        injectedWallets,
        isEmbeddedWalletEnabled,
        walletConnectWallet,
        metaMaskWallet,
        coinbaseSdkWallet,
        binanceWalletWallet,
        recentConnectorId,
      })
    }

    // Move the most recent wallet to the top of the list.
    orderedWallets.sort(sortByRecent)

    return orderedWallets
  }, [
    wallets,
    isEmbeddedWalletEnabled,
    isMetaMaskExtensionDetected,
    recentConnectorId,
    showSecondaryConnectors,
    sortByRecent,
  ])
}
