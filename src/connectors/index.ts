import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'
import { TrezorConnector } from '@web3-react/trezor-connector'
import { LedgerConnector } from '@web3-react/ledger-connector'
import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'

const NETWORK_URL = process.env.REACT_APP_NETWORK_URL
const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
const PORTIS_ID = process.env.REACT_APP_PORTIS_ID

// export const NETWORK_CHAIN_ID: number = parseInt(process.env.REACT_APP_CHAIN_ID ?? '1')
export const NETWORK_CHAIN_ID: number = 1
export const NETWORK_CHAIN_NAME: string = process.env.REACT_APP_CHAIN_NAME ?? 'mainnet'

if (typeof NETWORK_URL === 'undefined') {
  throw new Error(`REACT_APP_NETWORK_URL must be a defined environment variable`)
}

export const network = new NetworkConnector({
  urls: { [NETWORK_CHAIN_ID]: NETWORK_URL }
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 80001, 137]
})

export const walletconnect = new WalletConnectConnector({
  rpc: { [NETWORK_CHAIN_ID]: NETWORK_URL },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 15000
})

export const fortmatic = new FortmaticConnector({
  apiKey: FORMATIC_KEY ?? '',
  chainId: NETWORK_CHAIN_ID
})

export const portis = new PortisConnector({
  dAppId: PORTIS_ID ?? '',
  networks: [NETWORK_CHAIN_ID]
})

export const walletlink = new WalletLinkConnector({
  url: NETWORK_URL,
  appName: 'DmmExchange',
  appLogoUrl: 'https://i.ibb.co/yYH3kwL/favicon.png'
})

export const ledger = new LedgerConnector({
  chainId: NETWORK_CHAIN_ID,
  url: NETWORK_URL,
  pollingInterval: 15000
})

export const trezor = new TrezorConnector({
  chainId: NETWORK_CHAIN_ID,
  url: NETWORK_URL,
  manifestEmail: 'andrew@kyber.network',
  manifestAppUrl: 'https://dmm.exchange',
  pollingInterval: 15000
})
