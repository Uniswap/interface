import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ChainId } from '@uniswap/sdk-core'
import AppJsonRpcProvider from 'rpc/AppJsonRpcProvider'

import { CHAIN_IDS_TO_NAMES, SupportedInterfaceChain } from './chains'
import { RPC_URLS } from './networks'

const providerFactory = (chainId: SupportedInterfaceChain, i = 0) =>
  // Including networkish allows ethers to skip the initial detectNetwork call.
  new StaticJsonRpcProvider(RPC_URLS[chainId][i], /* networkish= */ { chainId, name: CHAIN_IDS_TO_NAMES[chainId] })

/**
 * These are the only JsonRpcProviders used directly by the interface.
 */
export const RPC_PROVIDERS: { [key in SupportedInterfaceChain]: StaticJsonRpcProvider } = {
  [ChainId.MAINNET]: new AppJsonRpcProvider(ChainId.MAINNET, [
    providerFactory(ChainId.MAINNET),
    providerFactory(ChainId.MAINNET, 1),
  ]),
  [ChainId.GOERLI]: providerFactory(ChainId.GOERLI),
  [ChainId.SEPOLIA]: providerFactory(ChainId.SEPOLIA),
  [ChainId.OPTIMISM]: providerFactory(ChainId.OPTIMISM),
  [ChainId.OPTIMISM_GOERLI]: providerFactory(ChainId.OPTIMISM_GOERLI),
  [ChainId.ARBITRUM_ONE]: new AppJsonRpcProvider(ChainId.ARBITRUM_ONE, [
    providerFactory(ChainId.ARBITRUM_ONE),
    providerFactory(ChainId.ARBITRUM_ONE, 1),
  ]),
  [ChainId.ARBITRUM_GOERLI]: providerFactory(ChainId.ARBITRUM_GOERLI),
  [ChainId.POLYGON]: providerFactory(ChainId.POLYGON),
  [ChainId.POLYGON_MUMBAI]: providerFactory(ChainId.POLYGON_MUMBAI),
  [ChainId.CELO]: providerFactory(ChainId.CELO),
  [ChainId.CELO_ALFAJORES]: providerFactory(ChainId.CELO_ALFAJORES),
  [ChainId.BNB]: providerFactory(ChainId.BNB),
  [ChainId.AVALANCHE]: providerFactory(ChainId.AVALANCHE),
  [ChainId.BASE]: providerFactory(ChainId.BASE),
}

export const DEPRECATED_RPC_PROVIDERS: { [key in SupportedInterfaceChain]: StaticJsonRpcProvider } = {
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
}
