import type { ExternalProvider } from '@ethersproject/providers'
import BRAVE_ICON from 'assets/wallets/brave-icon.svg'
import INJECTED_DARK_ICON from 'assets/wallets/browser-wallet-dark.svg'
import INJECTED_LIGHT_ICON from 'assets/wallets/browser-wallet-light.svg'
import LEDGER_ICON from 'assets/wallets/ledger-icon.svg'
import METAMASK_ICON from 'assets/wallets/metamask-icon.svg'
import RABBY_ICON from 'assets/wallets/rabby-icon.svg'
import TRUST_WALLET_ICON from 'assets/wallets/trustwallet-icon.svg'
import { EIP6963ProviderDetail } from 'connection/eip6963/types'
import { Connection, ConnectionType, ProviderInfo } from 'connection/types'
import { getInjectedMeta } from 'utils/walletMeta'

export const getIsInjected = () => Boolean(window.ethereum)

type InjectedWalletKey = keyof NonNullable<Window['ethereum']>

const InjectedWalletTable: { [key in InjectedWalletKey]?: ProviderInfo } = {
  isBraveWallet: { name: 'Brave', icon: BRAVE_ICON },
  isRabby: { name: 'Rabby', icon: RABBY_ICON },
  isTrust: { name: 'Trust Wallet', icon: TRUST_WALLET_ICON },
  isLedgerConnect: { name: 'Ledger', icon: LEDGER_ICON },
}

/** Returns boolean representing whether the app should still use the deprecated window.ethereum provider, based on eip6963 providers present */
export function shouldUseDeprecatedInjector(providerDetails: readonly EIP6963ProviderDetail[]): boolean {
  if (!window.ethereum) return false

  const { name: deprecatedInjectionName } = getInjectedMeta(window.ethereum)

  for (const injector of providerDetails) {
    // Compares window.ethereum flags (isMetaMask) to corresponding flags on eip6963 providers
    if (getInjectedMeta(injector.provider as ExternalProvider).name === deprecatedInjectionName) {
      return false
    }
  }

  return true
}

/**
 * Checks the window object for the presence of a known injectors and returns the most relevant injector name and icon.
 * Returns a default metamask installation object if no wallet is detected.
 *
 * @param isDarkMode - optional parameter to determine which color mode of the
 */
export function getDeprecatedInjection(isDarkMode?: boolean): ProviderInfo | undefined {
  for (const [key, wallet] of Object.entries(InjectedWalletTable)) {
    if (window.ethereum?.[key as keyof Window['ethereum']]) return wallet
  }

  // Check for MetaMask last, as some injectors will set isMetaMask = true in addition to their own, i.e. Brave browser
  if (window.ethereum?.isMetaMask) return { name: 'MetaMask', icon: METAMASK_ICON }

  // Prompt MetaMask install when no window.ethereum or eip6963 injection is present, or the only injection detected is coinbase (CB has separate entry point in UI)
  if (!window.ethereum || window.ethereum.isCoinbaseWallet) return { name: 'Install MetaMask', icon: METAMASK_ICON }

  // Use a generic icon when injection is present but no known non-coinbase wallet is detected
  return { name: 'Browser Wallet', icon: isDarkMode ? INJECTED_DARK_ICON : INJECTED_LIGHT_ICON }
}

/**
 * Returns true if `isMetaMask` is set to true and another non-metamask injector cannot be detected.
 *
 * Some non-metamask wallets set `isMetaMask` to true for dapp-compatability reasons. If one of these
 * injectors are detected, this function will return false.
 * https://wallet-docs.brave.com/ethereum/wallet-detection#compatability-with-metamask
 */
export const getIsMetaMaskWallet = () => getDeprecatedInjection()?.name === 'MetaMask'

export const getIsCoinbaseWallet = () => Boolean(window.ethereum?.isCoinbaseWallet)

// https://eips.ethereum.org/EIPS/eip-1193#provider-errors
export enum ErrorCode {
  USER_REJECTED_REQUEST = 4001,
  UNAUTHORIZED = 4100,
  UNSUPPORTED_METHOD = 4200,
  DISCONNECTED = 4900,
  CHAIN_DISCONNECTED = 4901,

  // https://docs.metamask.io/guide/rpc-api.html#unrestricted-methods
  CHAIN_NOT_ADDED = 4902,
  MM_ALREADY_PENDING = -32002,

  WC_V2_MODAL_CLOSED = 'Error: Connection request reset. Please try again.',
  WC_MODAL_CLOSED = 'Error: User closed modal',
  CB_REJECTED_REQUEST = 'Error: User denied account authorization',
}

// TODO(WEB-1973): merge this function with existing didUserReject for Swap errors
export function didUserReject(connection: Connection, error: any): boolean {
  return (
    error?.code === ErrorCode.USER_REJECTED_REQUEST ||
    (connection.type === ConnectionType.WALLET_CONNECT_V2 && error?.toString?.() === ErrorCode.WC_V2_MODAL_CLOSED) ||
    (connection.type === ConnectionType.COINBASE_WALLET && error?.toString?.() === ErrorCode.CB_REJECTED_REQUEST)
  )
}
