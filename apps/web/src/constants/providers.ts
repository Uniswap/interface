import { ChainId } from '@uniswap/sdk-core'
import AppJsonRpcProvider from 'rpc/AppJsonRpcProvider'

import ConfiguredJsonRpcProvider from 'rpc/ConfiguredJsonRpcProvider'
import { CHAIN_IDS_TO_NAMES, SupportedInterfaceChain } from './chains'
import { APP_RPC_URLS } from './networks'

const providerFactory = (chainId: SupportedInterfaceChain, i = 0) =>
  new ConfiguredJsonRpcProvider(APP_RPC_URLS[chainId][i], { chainId, name: CHAIN_IDS_TO_NAMES[chainId] })

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
  [ChainId.GOERLI]: getAppProvider(ChainId.GOERLI),
  [ChainId.SEPOLIA]: getAppProvider(ChainId.SEPOLIA),
  [ChainId.OPTIMISM]: getAppProvider(ChainId.OPTIMISM),
  [ChainId.OPTIMISM_GOERLI]: getAppProvider(ChainId.OPTIMISM_GOERLI),
  [ChainId.ARBITRUM_ONE]: getAppProvider(ChainId.ARBITRUM_ONE),
  [ChainId.ARBITRUM_GOERLI]: getAppProvider(ChainId.ARBITRUM_GOERLI),
  [ChainId.POLYGON]: getAppProvider(ChainId.POLYGON),
  [ChainId.POLYGON_MUMBAI]: getAppProvider(ChainId.POLYGON_MUMBAI),
  [ChainId.CELO]: getAppProvider(ChainId.CELO),
  [ChainId.CELO_ALFAJORES]: getAppProvider(ChainId.CELO_ALFAJORES),
  [ChainId.BNB]: getAppProvider(ChainId.BNB),
  [ChainId.AVALANCHE]: getAppProvider(ChainId.AVALANCHE),
  [ChainId.BASE]: getAppProvider(ChainId.BASE),
} satisfies Record<SupportedInterfaceChain, AppJsonRpcProvider>

export const DEPRECATED_RPC_PROVIDERS = {
  [ChainId.MAINNET]: providerFactory(ChainId.MAINNET),
  [ChainId.GOERLI]: providerFactory(ChainId.GOERLI),
  [ChainId.SEPOLIA]: providerFactory(ChainId.SEPOLIA),
  [ChainId.OPTIMISM]: providerFactory(ChainId.OPTIMISM),
  [ChainId.OPTIMISM_GOERLI]: providerFactory(ChainId.OPTIMISM_GOERLI),
  [ChainId.ARBITRUM_ONE]: providerFactory(ChainId.ARBITRUM_ONE),
  [ChainId.ARBITRUM_GOERLI]: providerFactory(ChainId.ARBITRUM_GOERLI),
  [ChainId.POLYGON]: providerFactory(ChainId.POLYGON),
  [ChainId.POLYGON_MUMBAI]: providerFactory(ChainId.POLYGON_MUMBAI),
  [ChainId.CELO]: providerFactory(ChainId.CELO),
  [ChainId.CELO_ALFAJORES]: providerFactory(ChainId.CELO_ALFAJORES),
  [ChainId.BNB]: providerFactory(ChainId.BNB),
  [ChainId.AVALANCHE]: providerFactory(ChainId.AVALANCHE),
  [ChainId.BASE]: providerFactory(ChainId.BASE),
} satisfies Record<SupportedInterfaceChain, ConfiguredJsonRpcProvider>
