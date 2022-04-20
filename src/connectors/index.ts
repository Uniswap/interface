import { Web3Provider } from '@ethersproject/providers'
import { SafeAppConnector } from '@gnosis.pm/safe-apps-web3-react'
import { ALL_SUPPORTED_CHAIN_IDS, SupportedChainId } from 'constants/chains'
import { INFURA_NETWORK_URLS } from 'constants/infura'
import { InjectedConnector } from 'web3-react-injected-connector'
import { WalletConnectConnector } from 'web3-react-walletconnect-connector'
import { WalletLinkConnector } from 'web3-react-walletlink-connector'

import UNISWAP_LOGO_URL from '../assets/svg/logo.svg'
import getLibrary from '../utils/getLibrary'
import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'

const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY

export const network = new NetworkConnector({
  urls: INFURA_NETWORK_URLS,
  defaultChainId: 1,
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? getLibrary(network.provider))
}

export const injected = new InjectedConnector({
  supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
})

export const gnosisSafe = new SafeAppConnector()

export const walletconnect = new WalletConnectConnector({
  supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
  rpc: INFURA_NETWORK_URLS,
  qrcode: true,
})

// mainnet only
export const fortmatic = new FortmaticConnector({
  apiKey: FORMATIC_KEY ?? '',
  chainId: 1,
})

export const walletlink = new WalletLinkConnector({
  url: INFURA_NETWORK_URLS[SupportedChainId.MAINNET],
  appName: 'Uniswap',
  appLogoUrl: UNISWAP_LOGO_URL,
  supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
})
