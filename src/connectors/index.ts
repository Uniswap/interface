import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'

import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'
import { ChainId } from '@fuseio/fuse-swap-sdk'

const NETWORK_URL = process.env.REACT_APP_NETWORK_URL
const ROPSTEN_NETWORK_URL = process.env.REACT_APP_ROPSTEN_NETWORK_URL
const MAINNET_NETWORK_URL = process.env.REACT_APP_MAINNET_NETWORK_URL
const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
const PORTIS_ID = process.env.REACT_APP_PORTIS_ID

export const NETWORK_CHAIN_ID: number = parseInt(process.env.REACT_APP_CHAIN_ID ?? '1')

if (typeof NETWORK_URL === 'undefined') {
  throw new Error(`REACT_APP_NETWORK_URL must be a defined environment variable`)
}

if (typeof ROPSTEN_NETWORK_URL === 'undefined') {
  throw new Error(`REACT_APP_ROPSTEN_NETWORK_URL must be a defined environment variable`)
}

if (typeof MAINNET_NETWORK_URL === 'undefined') {
  throw new Error(`REACT_APP_MAINNET_NETWORK_URL must be a defined environment variable`)
}

export const network = new NetworkConnector({
  urls: { [NETWORK_CHAIN_ID]: NETWORK_URL }
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

function buildNetworkLibrary(url: string, chainId: number) {
  const network = new NetworkConnector({
    urls: { [chainId]: url }
  })
  return new Web3Provider(network.provider as any)
}

export const getChainNetworkLibrary = (chainId: number) => {
  switch (chainId) {
    case ChainId.MAINNET:
      return buildNetworkLibrary(MAINNET_NETWORK_URL, chainId)
    case ChainId.ROPSTEN:
      return buildNetworkLibrary(ROPSTEN_NETWORK_URL, chainId)
    default:
      // fuse network library
      return getNetworkLibrary()
  }
}

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 122]
})

// mainnet only
export const walletconnect = new WalletConnectConnector({
  rpc: { 1: MAINNET_NETWORK_URL },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 15000
})

// mainnet only
export const fortmatic = new FortmaticConnector({
  apiKey: FORMATIC_KEY ?? '',
  chainId: 1
})

// mainnet only
export const portis = new PortisConnector({
  dAppId: PORTIS_ID ?? '',
  networks: [1]
})

// mainnet only
export const walletlink = new WalletLinkConnector({
  url: MAINNET_NETWORK_URL,
  appName: 'Uniswap',
  appLogoUrl:
    'https://mpng.pngfly.com/20181202/bex/kisspng-emoji-domain-unicorn-pin-badges-sticker-unicorn-tumblr-emoji-unicorn-iphoneemoji-5c046729264a77.5671679315437924251569.jpg'
})
