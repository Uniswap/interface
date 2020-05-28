import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'
import { TorusConnector } from '@web3-react/torus-connector'

import { NetworkConnector } from './Network'
import { FortmaticConnector } from './Fortmatic'

import * as dolomite from '@dolomite-exchange/dolomite'

const POLLING_INTERVAL = 5000
const NETWORK_URL =
  process.env.REACT_APP_IS_PRODUCTION_DEPLOY === 'true'
    ? process.env.REACT_APP_NETWORK_URL_PROD
    : process.env.REACT_APP_NETWORK_URL

export const network = new NetworkConnector({
  urls: { [Number(process.env.REACT_APP_CHAIN_ID)]: NETWORK_URL },
  pollingInterval: POLLING_INTERVAL
})

export const injected = new InjectedConnector({
  supportedChainIds: [Number(process.env.REACT_APP_CHAIN_ID)]
})

// mainnet only
export const walletconnect = new WalletConnectConnector({
  rpc: { 1: NETWORK_URL },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: POLLING_INTERVAL
})

// mainnet only
export const fortmatic = new FortmaticConnector({
  apiKey: process.env.REACT_APP_FORTMATIC_KEY,
  chainId: 1
})

// mainnet only
export const portis = new PortisConnector({
  dAppId: process.env.REACT_APP_PORTIS_ID,
  networks: [1]
})

export const torus = new TorusConnector({
  chainId: 1,
  initOptions: {
    showTorusButton: false
  }
})

// mainnet only
export const walletlink = new WalletLinkConnector({
  url: NETWORK_URL,
  appName: 'DMM Governance',
  appLogoUrl: 'https://github.com/defi-money-market-ecosystem/dmm-assets/blob/master/src/logo/dmm-logo-square.png?raw=true'
})

export const exchange = setupExchange()

function setupExchange() {
  dolomite.exchange.configure({ apiKey: 'EXCHANGE_API_KEY' })
  return dolomite.exchange
}