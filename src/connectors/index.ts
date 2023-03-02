import { ChainId } from '@kyberswap/ks-sdk-core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'

// import { InjectedConnector } from '@pangolindex/web3-react-injected-connector'
import { EVM_NETWORK, EVM_NETWORKS, NETWORKS_INFO, WALLET_CONNECT_SUPPORTED_CHAIN_IDS } from 'constants/networks'
import store from 'state'

import { NetworkConnector } from './NetworkConnector'

const NETWORK_URLS: {
  [chainId in EVM_NETWORK]: string
} = EVM_NETWORKS.reduce(
  (acc, val) => {
    acc[val] = NETWORKS_INFO[val].defaultRpcUrl
    return acc
  },
  {} as {
    [chainId in EVM_NETWORK]: string
  },
)

const NETWORK_URL = NETWORKS_INFO[ChainId.MAINNET].defaultRpcUrl

const NETWORK_CHAIN_ID = 1

export const network = new NetworkConnector({
  urls: NETWORK_URLS,
  defaultChainId: store.getState().user.chainId || NETWORK_CHAIN_ID,
})

const injectedConnectorParam = {
  supportedChainIds: EVM_NETWORKS,
}
export const injected = new InjectedConnector(injectedConnectorParam)

export const coin98InjectedConnector = new InjectedConnector(injectedConnectorParam)

export const braveInjectedConnector = new InjectedConnector(injectedConnectorParam)

export const walletconnect = new WalletConnectConnector({
  supportedChainIds: WALLET_CONNECT_SUPPORTED_CHAIN_IDS,
  rpc: NETWORK_URLS,
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
})

export const walletlink = new WalletLinkConnector({
  // TODO: check this later=> walletlink connect maybe failed because of this
  url: NETWORK_URL,
  appName: 'KyberSwap',
  appLogoUrl: 'https://kyberswap.com/favicon.ico',
})

export const trustWalletConnector = new InjectedConnector(injectedConnectorParam)
