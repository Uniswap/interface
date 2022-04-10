import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'
import getLibrary from '../utils/getLibrary'

import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'
import DIFFUSION_LOGO_URL from '../assets/svg/logo.svg'
import { ChainId, NETWORK_URLS } from '../constants/chains'

// const INFURA_KEY = process.env.REACT_APP_INFURA_KEY
const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
const PORTIS_ID = process.env.REACT_APP_PORTIS_ID
const WALLETCONNECT_BRIDGE_URL = process.env.REACT_APP_WALLETCONNECT_BRIDGE_URL

// if (typeof INFURA_KEY === 'undefined') {
//   throw new Error(`REACT_APP_INFURA_KEY must be a defined environment variable`)
// }

const SUPPORTED_CHAIN_IDS = [ChainId.MAINNET, ChainId.TESTNET, ChainId.RINKEBY]

/**
 * @TODO: Crypzoh: This is to enable the other connectors temporarily without removing them from the code
 */
const FAKE_CHAIN_ID = 3 // This is ropsten

export const network = new NetworkConnector({
  urls: NETWORK_URLS,
  defaultChainId: ChainId.MAINNET,
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? getLibrary(network.provider))
}

export const injected = new InjectedConnector({
  supportedChainIds: SUPPORTED_CHAIN_IDS,
})

export const walletconnect = new WalletConnectConnector({
  // supportedChainIds: SUPPORTED_CHAIN_IDS,
  supportedChainIds: [FAKE_CHAIN_ID],
  infuraId: '1234', //INFURA_KEY, // obviously a hack
  bridge: WALLETCONNECT_BRIDGE_URL,
  qrcode: true,
  pollingInterval: 15000,
})

// // mainnet only
export const fortmatic = new FortmaticConnector({
  apiKey: FORMATIC_KEY ?? '',
  chainId: FAKE_CHAIN_ID,
})

// // mainnet only
export const portis = new PortisConnector({
  dAppId: PORTIS_ID ?? '',
  networks: [FAKE_CHAIN_ID],
})

// // mainnet only
export const walletlink = new WalletLinkConnector({
  url: NETWORK_URLS[ChainId.MAINNET],
  appName: 'Diffusion Finance',
  appLogoUrl: DIFFUSION_LOGO_URL,
})
