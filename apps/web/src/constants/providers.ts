import { ChainId } from '@jaguarswap/sdk-core'
import AppJsonRpcProvider from 'rpc/AppJsonRpcProvider'

import ConfiguredJsonRpcProvider from 'rpc/ConfiguredJsonRpcProvider'
import { CHAIN_IDS_TO_NAMES, SupportedInterfaceChain } from './chains'
import { APP_RPC_URLS } from './networks'

const providerFactory = (chainId: SupportedInterfaceChain, i = 0) => new ConfiguredJsonRpcProvider(APP_RPC_URLS[chainId][i], { chainId, name: CHAIN_IDS_TO_NAMES[chainId] })

function getAppProvider(chainId: SupportedInterfaceChain) {
  console.log('🚀 ~ getAppProvider ~ chainId:', chainId)
  return new AppJsonRpcProvider(APP_RPC_URLS[chainId].map((url) => new ConfiguredJsonRpcProvider(url, { chainId, name: CHAIN_IDS_TO_NAMES[chainId] })))
}

/** These are the only JsonRpcProviders used directly by the interface. */
export const RPC_PROVIDERS = {
  [ChainId.X1_TESTNET]: getAppProvider(ChainId.X1_TESTNET),
} satisfies Record<SupportedInterfaceChain, AppJsonRpcProvider>

export const DEPRECATED_RPC_PROVIDERS = {
  [ChainId.X1]: providerFactory(ChainId.X1),
  [ChainId.X1_TESTNET]: providerFactory(ChainId.X1_TESTNET),
} satisfies Record<SupportedInterfaceChain, ConfiguredJsonRpcProvider>
