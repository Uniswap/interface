import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'
import { AbstractConnector } from '@web3-react/abstract-connector'

import { ChainId, NETWORK_URL, SUPPORTED_CHAIN_IDS, FORMATIC_KEY, PORTIS_ID } from '../constants'
import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'


console.debug(NETWORK_URL)
console.debug(SUPPORTED_CHAIN_IDS)

export const network = new NetworkConnector({
  urls: NETWORK_URL,
  defaultChainId: ChainId.MAINNET
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

export const injected = new InjectedConnector({
  supportedChainIds: SUPPORTED_CHAIN_IDS
})

//Patch chainChanged 0xNaN
//@ts-ignore
injected.handleChainChanged = (chainId: string | number) => {
  console.debug("Handling 'chainChanged' event with payload", chainId)
  if (chainId === "0xNaN") return; //Ignore 0xNaN, when user doesn't set chainId
  //@ts-ignore
  injected.emitUpdate({ chainId, provider: window.ethereum })
}

//Patch networkChanged loading error
//@ts-ignore
injected.handleNetworkChanged = (networkId: string | number) => {
  console.debug("Handling 'networkChanged' event with payload", networkId)
  if (networkId === "loading") return; //Ignore loading, networkId as causes errors
  //@ts-ignore
  injected.emitUpdate({ chainId: networkId, provider: window.ethereum })
}

// mainnet only
export const walletconnect = new WalletConnectConnector({
  rpc: { [ChainId.MAINNET]: NETWORK_URL[ChainId.MAINNET] },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 15000
})

// mainnet only
export const fortmatic = new FortmaticConnector({
  apiKey: FORMATIC_KEY ?? '',
  chainId: ChainId.MAINNET
})

// mainnet only
export const portis = new PortisConnector({
  dAppId: PORTIS_ID ?? '',
  networks: [ChainId.MAINNET]
})

// mainnet only
export const walletlink = new WalletLinkConnector({
  url: NETWORK_URL[ChainId.MAINNET],
  appName: 'Uniswap',
  appLogoUrl:
    'https://mpng.pngfly.com/20181202/bex/kisspng-emoji-domain-unicorn-pin-badges-sticker-unicorn-tumblr-emoji-unicorn-iphoneemoji-5c046729264a77.5671679315437924251569.jpg'
})

export interface WalletInfo {
  connector?: AbstractConnector
  name: string
  iconName: string
  description: string
  href: string | null
  color: string
  primary?: true
  mobile?: true
  mobileOnly?: true
}

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    iconName: 'arrow-right.svg',
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.png',
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D'
  },
  WALLET_CONNECT: {
    connector: walletconnect,
    name: 'WalletConnect',
    iconName: 'walletConnectIcon.svg',
    description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    href: null,
    color: '#4196FC',
    mobile: true
  },
  WALLET_LINK: {
    connector: walletlink,
    name: 'Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Use Coinbase Wallet app on mobile device',
    href: null,
    color: '#315CF5'
  },
  COINBASE_LINK: {
    name: 'Open in Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Open in Coinbase Wallet app.',
    href: 'https://go.cb-w.com/mtUDhEZPy1',
    color: '#315CF5',
    mobile: true,
    mobileOnly: true
  },
  FORTMATIC: {
    connector: fortmatic,
    name: 'Fortmatic',
    iconName: 'fortmaticIcon.png',
    description: 'Login using Fortmatic hosted wallet',
    href: null,
    color: '#6748FF',
    mobile: true
  },
  Portis: {
    connector: portis,
    name: 'Portis',
    iconName: 'portisIcon.png',
    description: 'Login using Portis hosted wallet',
    href: null,
    color: '#4A6C9B',
    mobile: true
  }
}