import { Web3Provider } from '@ethersproject/providers'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { LedgerConnector } from '@web3-react/ledger-connector'
import { PortisConnector } from '@web3-react/portis-connector'
import { TrezorConnector } from '@web3-react/trezor-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'

// import { InjectedConnector } from '@pangolindex/web3-react-injected-connector'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'

import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'

const NETWORK_URL = NETWORKS_INFO[ChainId.MAINNET].rpcUrl
const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY // todo: remove
const PORTIS_ID = process.env.REACT_APP_PORTIS_ID // todo: remove

// export const NETWORK_CHAIN_ID: number = parseInt(process.env.REACT_APP_CHAIN_ID ?? '1')
export const NETWORK_CHAIN_ID = 1

export const network = new NetworkConnector({
  urls: { [NETWORK_CHAIN_ID]: NETWORK_URL },
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

const injectedConnectorParam = {
  supportedChainIds: [
    ChainId.MAINNET,
    ChainId.ETHW,
    ChainId.ROPSTEN,
    ChainId.RINKEBY,
    ChainId.GÖRLI,
    ChainId.KOVAN,
    ChainId.MUMBAI,
    ChainId.MATIC,
    ChainId.BSCMAINNET,
    ChainId.BSCTESTNET,
    ChainId.AVAXMAINNET,
    ChainId.AVAXTESTNET,
    ChainId.FANTOM,
    ChainId.CRONOS,
    ChainId.CRONOSTESTNET,
    ChainId.BTTC,
    ChainId.ARBITRUM,
    ChainId.ARBITRUM_TESTNET,
    ChainId.AURORA,
    ChainId.VELAS,
    ChainId.OASIS,
    ChainId.OPTIMISM,
  ],
}
export const injected = new InjectedConnector(injectedConnectorParam)

export const coin98InjectedConnector = new InjectedConnector(injectedConnectorParam)

export const braveInjectedConnector = new InjectedConnector(injectedConnectorParam)

const WALLET_CONNECT_SUPPORTED_CHAIN_IDS: ChainId[] = [
  ChainId.MAINNET,
  ChainId.ETHW,
  ChainId.ROPSTEN,
  ChainId.MUMBAI,
  ChainId.MATIC,
  ChainId.BSCTESTNET,
  ChainId.BSCMAINNET,
  ChainId.AVAXTESTNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.CRONOSTESTNET,
  ChainId.CRONOS,
  ChainId.BTTC,
  ChainId.ARBITRUM,
  ChainId.ARBITRUM_TESTNET,
  ChainId.AURORA,
  ChainId.VELAS,
  ChainId.OASIS,
  ChainId.OPTIMISM,
]

export const NETWORK_URLS: {
  [chainId in ChainId]: string
} = SUPPORTED_NETWORKS.reduce(
  (acc, val) => {
    acc[val] = NETWORKS_INFO[val].rpcUrl
    return acc
  },
  {} as {
    [chainId in ChainId]: string
  },
)

export const walletconnect = new WalletConnectConnector({
  supportedChainIds: WALLET_CONNECT_SUPPORTED_CHAIN_IDS,
  rpc: NETWORK_URLS,
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
})

export const fortmatic = new FortmaticConnector({
  apiKey: FORMATIC_KEY ?? '',
  chainId: NETWORK_CHAIN_ID,
})

export const portis = new PortisConnector({
  dAppId: PORTIS_ID ?? '',
  networks: [NETWORK_CHAIN_ID],
})

export const walletlink = new WalletLinkConnector({
  // TODO: check this later=> walletlink connect maybe failed becauseof this
  url: NETWORK_URL,
  appName: 'KyberSwap',
  appLogoUrl: 'https://kyberswap.com/favicon.ico',
})

export const ledger = new LedgerConnector({
  chainId: NETWORK_CHAIN_ID,
  url: NETWORK_URL,
  pollingInterval: 15000,
})

export const trezor = new TrezorConnector({
  chainId: NETWORK_CHAIN_ID,
  url: NETWORK_URL,
  manifestEmail: 'andrew@kyber.network',
  manifestAppUrl: 'https://dmm.exchange',
  pollingInterval: 15000,
})
