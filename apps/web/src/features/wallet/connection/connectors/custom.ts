import { connect } from '@wagmi/core'
import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider/constants'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { uniswapWalletConnect } from 'components/Web3Provider/walletConnect'
import { ConnectionService } from 'features/wallet/connection/services/IConnectionService'
import { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { useSignInWithPasskey } from 'hooks/useSignInWithPasskey'
import { useUpdateAtom } from 'jotai/utils'
import { useMemo } from 'react'
import { persistHideMobileAppPromoBannerAtom } from 'state/application/atoms'
import { CONNECTION_PROVIDER_IDS, CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'

const APPLY_CUSTOM_CONNECTOR_META_MAP = {
  [CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID]: applyUniswapWalletConnectorMeta,
  [CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID]: applyEmbeddedWalletConnectorMeta,
} as const

/**
 * Applies custom connector metadata transformations to the base wallet connector array.
 *
 * Takes a base array of wallet connectors and applies custom transformations for
 * connectors that need special handling beyond standard configuration.
 *
 * Current transformations:
 * - Uniswap Wallet: Adds a new connector to the array
 * - Embedded Wallet: Adds customConnectorId, needed to trigger specific behavior in connection flow.
 * - Icon overrides: Applies custom icons from CONNECTOR_ICON_OVERRIDE_MAP
 *
 */
export function applyCustomConnectorMeta(walletConnectors: WalletConnectorMeta[]): WalletConnectorMeta[] {
  return Object.values(APPLY_CUSTOM_CONNECTOR_META_MAP)
    .reduce((acc, applyCustomConnectorMeta) => applyCustomConnectorMeta(acc), walletConnectors)
    .map((connector) => {
      const iconOverride = CONNECTOR_ICON_OVERRIDE_MAP[connector.name]
      if (iconOverride) {
        return { ...connector, icon: iconOverride }
      }
      return connector
    })
}

// CUSTOM CONNECTOR FUNCTIONS

// =========================================
// Uniswap Wallet Connect
// =========================================
// Lazy-initialized on connection to prevent socket conflicts.
// Standard wagmi initialization creates persistent WebSocket connections
// that can interfere with each other and cause message drops.
export function useUniswapMobileConnectionService(): ConnectionService {
  const setPersistHideMobileAppPromoBanner = useUpdateAtom(persistHideMobileAppPromoBannerAtom)

  return useMemo(
    () => ({
      connect: async () => {
        setPersistHideMobileAppPromoBanner(true)

        // Initialize Uniswap Wallet on click instead of in wagmi config
        // to avoid multiple wallet connect sockets being opened
        // and causing issues with messages getting dropped
        await connect(wagmiConfig, { connector: uniswapWalletConnect() })
        return { connected: true }
      },
    }),
    [setPersistHideMobileAppPromoBanner],
  )
}

const UNISWAP_WALLET_CONNECTOR_META = {
  name: CONNECTION_PROVIDER_NAMES.UNISWAP_WALLET,
  icon: CONNECTOR_ICON_OVERRIDE_MAP[CONNECTION_PROVIDER_NAMES.UNISWAP_WALLET],
  customConnectorId: CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
  isInjected: false,
  analyticsWalletType: 'Wallet Connect',
}
/** Adds a WalletConnectorMeta for the Uniswap Wallet Connect connector. */
function applyUniswapWalletConnectorMeta(walletConnectors: WalletConnectorMeta[]): WalletConnectorMeta[] {
  return [...walletConnectors, UNISWAP_WALLET_CONNECTOR_META]
}

// =========================================
// Embedded Wallet - Custom Connector
// =========================================
// Requires custom authentication flow via passkey sign-in.
// Unlike standard wagmi connectors that activate immediately,
// this connector needs to complete the passkey flow before
// updating wagmi's connection state.

/** Adds a customConnectorId to the embedded wallet connector to ensure it is treated as a custom connector. */
function applyEmbeddedWalletConnectorMeta(walletConnectors: WalletConnectorMeta[]): WalletConnectorMeta[] {
  return walletConnectors.map((walletConnector) => {
    if (walletConnector.wagmi?.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID) {
      return { ...walletConnector, customConnectorId: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID }
    }
    return walletConnector
  })
}

export function useUniswapEmbeddedConnectionService(): ConnectionService {
  const { signInWithPasskeyAsync } = useSignInWithPasskey()

  return useMemo(
    () => ({
      connect: async () => {
        await signInWithPasskeyAsync()
        return { connected: true }
      },
    }),
    [signInWithPasskeyAsync],
  )
}
