import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector as CEWConnector } from '@ubeswap/injected-connector'
import { ChainId, parseNetwork } from '@ubeswap/sdk'
import { InjectedConnector } from '@web3-react/injected-connector'

import { LedgerConnector } from './ledger/LedgerConnector'
import { NetworkConnector } from './NetworkConnector'
import { ValoraConnector } from './valora/ValoraConnector'

const networkChainIDFromHostname: ChainId = window.location.hostname.includes('alfajores')
  ? ChainId.ALFAJORES
  : window.location.hostname.includes('baklava')
  ? ChainId.BAKLAVA
  : ChainId.MAINNET

export const NETWORK_CHAIN_ID: ChainId = process.env.REACT_APP_CHAIN_ID
  ? parseNetwork(parseInt(process.env.REACT_APP_CHAIN_ID))
  : networkChainIDFromHostname

const chainIdToName = (chainId: ChainId): string => {
  switch (chainId) {
    case ChainId.ALFAJORES:
      return 'alfajores'
    case ChainId.BAKLAVA:
      return 'baklava'
    case ChainId.MAINNET:
      return 'mainnet'
    default:
      return 'unknown'
  }
}

export const NETWORK_CHAIN_NAME: string = chainIdToName(NETWORK_CHAIN_ID)

console.log('Loading Ubeswap interface at', window.location.hostname, networkChainIDFromHostname, NETWORK_CHAIN_ID)

export const network = new NetworkConnector({
  defaultChainId: NETWORK_CHAIN_ID,
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

export const injected = new InjectedConnector({
  supportedChainIds: [NETWORK_CHAIN_ID],
})

export const celoExtensionWallet = new CEWConnector({
  supportedChainIds: [NETWORK_CHAIN_ID],
})

export const ledger = new LedgerConnector()

export const valora = new ValoraConnector({
  defaultChainId: NETWORK_CHAIN_ID,
})
