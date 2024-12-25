import { Web3Provider } from '@ethersproject/providers'
import { SafeAppConnector } from '@gnosis.pm/safe-apps-web3-react'
import { UAuthConnector } from '@uauth/web3-react'
import { InjectedConnector } from '@web3-react/injected-connector'
import { PortisConnector } from '@web3-react/portis-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'

import UNISWAP_LOGO_URL from '../assets/svg/logo.svg'
import {
  ALCHEMY_NETWORK_URLS,
  ALL_SUPPORTED_CHAIN_IDS,
  INFURA_NETWORK_URLS,
  SupportedChainId,
} from '../constants/chains'
import getLibrary from '../utils/getLibrary'
import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'

const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
const PORTIS_ID = process.env.REACT_APP_PORTIS_ID

export const network = new NetworkConnector({
  urls: ALCHEMY_NETWORK_URLS,
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
  rpc: ALCHEMY_NETWORK_URLS,
  qrcode: true,
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
  url: ALCHEMY_NETWORK_URLS[SupportedChainId.MAINNET],
  appName: 'Kromatika',
  appLogoUrl: UNISWAP_LOGO_URL,
})

export const unstopabbledomains = new UAuthConnector({
  clientID: process.env.REACT_APP_UD_CLIENT_ID,
  redirectUri: process.env.REACT_APP_UD_REDIRECT_URI,
  postLogoutRedirectUri: process.env.REACT_APP_UD_POST_LOGOUT_REDIRECT_URI,

  // Scope must include openid and wallet
  scope: 'openid wallet',

  // Injected and walletconnect connectors are required.
  connectors: { injected, walletconnect },
})
