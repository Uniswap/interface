import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ChainId, SupportedChainsType } from '@uniswap/sdk-core'

import AppJsonRpcProvider from './appProvider'

/**
 * These are the only JsonRpcProviders used directly by the interface.
 */
export const RPC_PROVIDERS: { [key in SupportedChainsType]: StaticJsonRpcProvider } = {
  [ChainId.MAINNET]: new AppJsonRpcProvider(ChainId.MAINNET),
  [ChainId.GOERLI]: new AppJsonRpcProvider(ChainId.GOERLI),
  [ChainId.SEPOLIA]: new AppJsonRpcProvider(ChainId.SEPOLIA),
  [ChainId.OPTIMISM]: new AppJsonRpcProvider(ChainId.OPTIMISM),
  [ChainId.OPTIMISM_GOERLI]: new AppJsonRpcProvider(ChainId.OPTIMISM_GOERLI),
  [ChainId.ARBITRUM_ONE]: new AppJsonRpcProvider(ChainId.ARBITRUM_ONE),
  [ChainId.ARBITRUM_GOERLI]: new AppJsonRpcProvider(ChainId.ARBITRUM_GOERLI),
  [ChainId.POLYGON]: new AppJsonRpcProvider(ChainId.POLYGON),
  [ChainId.POLYGON_MUMBAI]: new AppJsonRpcProvider(ChainId.POLYGON_MUMBAI),
  [ChainId.CELO]: new AppJsonRpcProvider(ChainId.CELO),
  [ChainId.CELO_ALFAJORES]: new AppJsonRpcProvider(ChainId.CELO_ALFAJORES),
  [ChainId.BNB]: new AppJsonRpcProvider(ChainId.BNB),
  [ChainId.AVALANCHE]: new AppJsonRpcProvider(ChainId.AVALANCHE),
  [ChainId.BASE]: new AppJsonRpcProvider(ChainId.BASE),
  [ChainId.BASE_GOERLI]: new AppJsonRpcProvider(ChainId.BASE_GOERLI),
}
