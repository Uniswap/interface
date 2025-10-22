import type { ExternalProvider, FallbackProvider, JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import type WalletConnectProvider from '@walletconnect/ethereum-provider'

function isWeb3Provider(provider: JsonRpcProvider | FallbackProvider): provider is Web3Provider {
  return 'provider' in provider
}

function isWalletConnectProvider(provider: ExternalProvider): provider is WalletConnectProvider {
  return (provider as WalletConnectProvider).isWalletConnect
}

export enum WalletType {
  WALLET_CONNECT = 'WalletConnect',
  INJECTED = 'Injected',
}

/**
 * WalletMeta for WalletConnect or Injected wallets.
 *
 * For WalletConnect wallets, name, description, url, and icons are taken from WalletConnect's peerMeta
 * v1: @see https://docs.walletconnect.com/1.0/specs#session-request
 * v2: @see https://docs.walletconnect.com/2.0/specs/clients/core/pairing/data-structures#metadata
 *
 * For Injected wallets, the name is derived from the `is*` properties on the provider (eg `isCoinbaseWallet`).
 */
export interface WalletMeta {
  type: WalletType
  /**
   * The agent string of the wallet, for use with analytics/debugging.
   * Denotes the wallet's provenance - analagous to a User String - including all `is*` properties and the type.
   *
   * Some injected wallets are used different ways (eg with/without spoofing MetaMask).
   * The agent will capture these differences, while the name will not.
   *
   * @example 'CoinbaseWallet qUrl (Injected)'
   */
  agent: string
  /**
   * The name of the wallet, for use with UI.
   *
   * @example 'CoinbaseWallet'
   */
  name?: string
  description?: string
  url?: string
  icons?: string[]
}

function getWalletConnectMeta(provider: WalletConnectProvider): WalletMeta {
  const metadata = provider.session?.peer.metadata
  return {
    type: WalletType.WALLET_CONNECT,
    agent: metadata ? `${metadata.name} (WalletConnect)` : '(WalletConnect)',
    ...metadata,
  }
}

function getInjectedMeta(provider: ExternalProvider & Record<string, unknown>): WalletMeta {
  const properties = Object.getOwnPropertyNames(provider)

  const names = properties
    .filter((name) => name.match(/^is.*$/) && (provider as Record<string, unknown>)[name] === true)
    .map((name) => name.slice(2))

  // Many wallets spoof MetaMask by setting `isMetaMask` along with their own identifier,
  // so we sort MetaMask last so that these wallets' names come first.
  names.sort((a, b) => (a === 'MetaMask' ? 1 : b === 'MetaMask' ? -1 : 0))

  // Coinbase Wallet can be connected through an extension or a QR code, with `qrUrl` as the only differentiator,
  // so we capture `qrUrl` in the agent string.
  if (properties.includes('qrUrl') && provider.qrUrl) {
    names.push('qrUrl')
  }

  return {
    type: WalletType.INJECTED,
    agent: [...names, '(Injected)'].join(' '),
    name: names[0],
    // TODO(WEB-2914): Populate description, url, and icons for known wallets.
  }
}

export function getWalletMeta(provider: JsonRpcProvider | FallbackProvider): WalletMeta | undefined {
  if (!isWeb3Provider(provider)) {
    return undefined
  }

  if (isWalletConnectProvider(provider.provider)) {
    return getWalletConnectMeta(provider.provider)
  } else {
    return getInjectedMeta(provider.provider)
  }
}
