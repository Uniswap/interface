import { ChainId } from '@ubeswap/sdk-core'
import AppJsonRpcProvider from 'rpc/AppJsonRpcProvider'

import ConfiguredJsonRpcProvider from 'rpc/ConfiguredJsonRpcProvider'
import { CHAIN_IDS_TO_NAMES, SupportedInterfaceChain } from './chains'
import { APP_RPC_URLS } from './networks'

function getAppProvider(chainId: SupportedInterfaceChain) {
  return new AppJsonRpcProvider(
    APP_RPC_URLS[chainId].map(
      (url) => new ConfiguredJsonRpcProvider(url, { chainId, name: CHAIN_IDS_TO_NAMES[chainId] })
    )
  )
}

/** These are the only JsonRpcProviders used directly by the interface. */
export const RPC_PROVIDERS = {
  [ChainId.MAINNET]: getAppProvider(ChainId.MAINNET),
  [ChainId.CELO]: getAppProvider(ChainId.CELO),
  [ChainId.CELO_ALFAJORES]: getAppProvider(ChainId.CELO_ALFAJORES),
} satisfies Record<SupportedInterfaceChain, AppJsonRpcProvider>
