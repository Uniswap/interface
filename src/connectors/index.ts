import { ChainId } from '@alagunoff/uniswap-sdk-core'
import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'
import getLibrary from '../utils/getLibrary'

import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'
import UNISWAP_LOGO_URL from '../assets/svg/logo.svg'
import { SupportedChainId } from 'constants/addresses'

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY
const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
const PORTIS_ID = process.env.REACT_APP_PORTIS_ID
const WALLETCONNECT_BRIDGE_URL = process.env.REACT_APP_WALLETCONNECT_BRIDGE_URL

if (typeof INFURA_KEY === 'undefined') {
  throw new Error(`REACT_APP_INFURA_KEY must be a defined environment variable`)
}

export const NETWORK_URLS: { [key in SupportedChainId]: string } = {
  [ChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.RINKEBY]: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.ROPSTEN]: `https://ropsten.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.GOERLI]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.KOVAN]: `https://kovan.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.POLYGON_AMOY]: 'https://rpc-amoy.polygon.technology',
}

const SUPPORTED_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.RINKEBY,
  ChainId.ROPSTEN,
  ChainId.KOVAN,
  ChainId.GÖRLI,
  ChainId.POLYGON_AMOY,
]

export const network = new NetworkConnector({
  urls: NETWORK_URLS,
  defaultChainId: ChainId.POLYGON_AMOY,
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? getLibrary(network.provider))
}

export const injected = new InjectedConnector({
  supportedChainIds: SUPPORTED_CHAIN_IDS,
})

export const walletconnect = new WalletConnectConnector({
  supportedChainIds: SUPPORTED_CHAIN_IDS,
  infuraId: INFURA_KEY, // obviously a hack
  bridge: WALLETCONNECT_BRIDGE_URL,
  qrcode: true,
  pollingInterval: 15000,
})

// mainnet only
export const fortmatic = new FortmaticConnector({
  apiKey: FORMATIC_KEY ?? '',
  chainId: 1,
})

// mainnet only
export const portis = new PortisConnector({
  dAppId: PORTIS_ID ?? '',
  networks: [1],
})

// mainnet only
export const walletlink = new WalletLinkConnector({
  url: NETWORK_URLS[ChainId.MAINNET],
  appName: 'Uniswap',
  appLogoUrl: UNISWAP_LOGO_URL,
})
