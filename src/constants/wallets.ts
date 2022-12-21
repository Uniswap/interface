import { BaseMessageSignerWalletAdapter, WalletReadyState } from '@solana/wallet-adapter-base'
import {
  BraveWalletAdapter,
  Coin98WalletAdapter,
  CoinbaseWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { isMobile } from 'react-device-detect'

import BRAVE from 'assets/wallets-connect/brave.svg'
import COIN98 from 'assets/wallets-connect/coin98.svg'
import COINBASE from 'assets/wallets-connect/coinbase.svg'
import METAMASK from 'assets/wallets-connect/metamask.svg'
import PHANTOM from 'assets/wallets-connect/phantom.svg'
import SLOPE from 'assets/wallets-connect/slope.svg'
import SOLFLARE from 'assets/wallets-connect/solflare.svg'
import TRUSTWALLET from 'assets/wallets-connect/trust-wallet.svg'
import WALLETCONNECT from 'assets/wallets-connect/wallet-connect.svg'
import {
  braveInjectedConnector,
  coin98InjectedConnector,
  injected,
  trustWalletConnector,
  walletconnect,
  walletlink,
} from 'connectors'
import checkForBraveBrowser from 'utils/checkForBraveBrowser'

import { SelectedNetwork } from './networks/solana'

const braveAdapter = new BraveWalletAdapter()
const coinbaseAdapter = new CoinbaseWalletAdapter()
const coin98Adapter = new Coin98WalletAdapter()
const solflareAdapter = new SolflareWalletAdapter({ network: SelectedNetwork })
const phantomAdapter = new PhantomWalletAdapter({ network: SelectedNetwork })
const slopeAdapter = new SlopeWalletAdapter({ network: SelectedNetwork })

const detectMetamask = (): WalletReadyState => {
  if (!window.ethereum) return WalletReadyState.Unsupported
  // In Brave browser, by default ethereum.isMetaMask and ethereum.isBraveWallet is true even Metamask not installed
  if (window.ethereum?.isMetaMask && !window.ethereum?.isBraveWallet) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectBrave = (): WalletReadyState => {
  //todo known issue: fail connect on mobile solana
  if (checkForBraveBrowser() && window.ethereum?.isBraveWallet) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectCoin98 = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.Unsupported
  if (window.ethereum && window.coin98) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectCoinbase = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.Unsupported
  // in NotDetected case, Coinbase show install link itself
  if (window.ethereum?.isCoinbaseWallet || window.ethereum?.providers?.some(p => p?.isCoinbaseWallet))
    return WalletReadyState.Installed
  if (window.coinbaseWalletExtension) return WalletReadyState.Loadable
  return WalletReadyState.NotDetected
}

const detectCoinBaseLink = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.Loadable
  return WalletReadyState.Unsupported
}

const detectPhantomWallet = (): WalletReadyState => {
  // On Brave browser disable phantom
  if (window.solana?.isPhantom && window.solana?.isBraveWallet) return WalletReadyState.NotDetected
  return phantomAdapter.readyState
}
const detectTrustWallet = (): WalletReadyState => {
  if (!window.ethereum) return WalletReadyState.Unsupported
  if (window.ethereum?.isTrustWallet) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

export interface WalletInfo {
  name: string
  icon: string
  iconLight: string
  installLink?: string
  href?: string
}

export interface EVMWalletInfo extends WalletInfo {
  connector: AbstractConnector
  readyState: () => WalletReadyState
}

export interface SolanaWalletInfo extends WalletInfo {
  adapter: BaseMessageSignerWalletAdapter
  readyStateSolana: () => WalletReadyState
}

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    icon: METAMASK,
    iconLight: METAMASK,
    installLink: 'https://metamask.io/download',
    readyState: detectMetamask,
  } as EVMWalletInfo,
  BRAVE: {
    connector: braveInjectedConnector,
    adapter: braveAdapter,
    name: 'Brave Wallet',
    icon: BRAVE,
    iconLight: BRAVE,
    installLink: 'https://brave.com/download',
    readyState: detectBrave,
    // If Phantom extension installed block Brave wallet
    readyStateSolana: () => (window.solana?.isBraveWallet ? braveAdapter.readyState : WalletReadyState.NotDetected),
  } as EVMWalletInfo & SolanaWalletInfo,
  COIN98: {
    connector: coin98InjectedConnector,
    adapter: coin98Adapter,
    name: 'Coin98',
    icon: COIN98,
    iconLight: COIN98,
    installLink: 'https://wallet.coin98.com/',
    readyState: detectCoin98,
    readyStateSolana: () => coin98Adapter.readyState,
  } as EVMWalletInfo & SolanaWalletInfo,
  COINBASE: {
    connector: walletlink,
    adapter: coinbaseAdapter,
    name: 'Coinbase',
    icon: COINBASE,
    iconLight: COINBASE,
    installLink: 'https://www.coinbase.com/wallet',
    readyState: detectCoinbase,
    readyStateSolana: () => (isMobile ? WalletReadyState.Unsupported : coinbaseAdapter.readyState),
  } as EVMWalletInfo & SolanaWalletInfo,
  COINBASE_LINK: {
    // To get this link: go to Coinbase app -> Dapp Browser -> go to dmm.exchange -> click "..." button -> share -> copy link
    href: 'https://go.cb-w.com/S7mannYpWjb',
    name: 'Coinbase Wallet',
    icon: COINBASE,
    iconLight: COINBASE,
    readyState: detectCoinBaseLink,
  } as EVMWalletInfo,
  WALLET_CONNECT: {
    connector: walletconnect,
    name: 'WalletConnect',
    icon: WALLETCONNECT,
    iconLight: WALLETCONNECT,
    installLink: 'https://walletconnect.com/',
    readyState: () => WalletReadyState.Installed,
  } as EVMWalletInfo,
  SOLFLARE: {
    adapter: solflareAdapter,
    name: 'Solflare',
    icon: SOLFLARE,
    iconLight: SOLFLARE,
    installLink: solflareAdapter.url,
    readyStateSolana: () => solflareAdapter.readyState,
  } as SolanaWalletInfo,
  PHANTOM: {
    adapter: phantomAdapter,
    name: 'Phantom',
    icon: PHANTOM,
    iconLight: PHANTOM,
    installLink: phantomAdapter.url,
    readyStateSolana: detectPhantomWallet,
  } as SolanaWalletInfo,
  SLOPE: {
    adapter: slopeAdapter,
    name: 'Slope Wallet',
    icon: SLOPE,
    iconLight: SLOPE,
    installLink: slopeAdapter.url,
    readyStateSolana: () => (isMobile ? WalletReadyState.Unsupported : slopeAdapter.readyState),
  } as SolanaWalletInfo,
  TRUST_WALLET: {
    connector: trustWalletConnector,
    name: 'Trust Wallet',
    icon: TRUSTWALLET,
    iconLight: TRUSTWALLET,
    installLink: 'https://trustwallet.com/vi/deeplink/',
    readyState: detectTrustWallet,
  } as EVMWalletInfo,
} as const

export type SUPPORTED_WALLET = keyof typeof SUPPORTED_WALLETS

export const WALLETLINK_LOCALSTORAGE_NAME = '-walletlink:https://www.walletlink.org:Addresses'
