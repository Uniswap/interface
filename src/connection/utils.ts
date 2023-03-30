import { isMobile } from 'utils/userAgent'

export const getIsInjected = () => Boolean(window.ethereum)

// When using Brave browser, `isMetaMask` is set to true when using the built-in wallet
// This variable should be true only when using the MetaMask extension
// https://wallet-docs.brave.com/ethereum/wallet-detection#compatability-with-metamask
type NonMetaMaskFlag = 'isRabby' | 'isBraveWallet' | 'isTrustWallet' | 'isLedgerConnect'
const allNonMetamaskFlags: NonMetaMaskFlag[] = ['isRabby', 'isBraveWallet', 'isTrustWallet', 'isLedgerConnect']
const getIsKnownGenericInjector = () => allNonMetamaskFlags.some((flag) => window.ethereum?.[flag])

export const getIsMetaMaskWallet = () => Boolean(window.ethereum?.isMetaMask && !getIsKnownGenericInjector())

const getIsCoinbaseWallet = () => Boolean(window.ethereum?.isCoinbaseWallet)
export const getIsCoinbaseWalletBrowser = () => isMobile && Boolean(window.ethereum?.isCoinbaseWallet)

export const getIsKnownWalletBrowser = () =>
  isMobile && (getIsCoinbaseWallet() || getIsMetaMaskWallet() || getIsKnownGenericInjector())

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

  WC_MODAL_CLOSED = 'Error: User closed modal',
  CB_REJECTED_REQUEST = 'Error: User denied account authorization',
}
