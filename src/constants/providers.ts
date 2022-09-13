import { StaticJsonRpcProvider } from '@ethersproject/providers'

import { SupportedChainId } from './chains'
import { RPC_URLS } from './networks'

/**
 * These are the only JsonRpcProviders used directly by the interface.
 */
export const RPC_PROVIDERS: { [key in SupportedChainId]: StaticJsonRpcProvider } = {
  [SupportedChainId.MAINNET]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.MAINNET]),
  [SupportedChainId.RINKEBY]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.RINKEBY]),
  [SupportedChainId.ROPSTEN]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.ROPSTEN]),
  [SupportedChainId.GOERLI]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.GOERLI]),
  [SupportedChainId.KOVAN]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.KOVAN]),
  [SupportedChainId.OPTIMISM]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.OPTIMISM]),
  [SupportedChainId.OPTIMISTIC_KOVAN]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.OPTIMISTIC_KOVAN]),
  [SupportedChainId.ARBITRUM_ONE]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.ARBITRUM_ONE]),
  [SupportedChainId.ARBITRUM_RINKEBY]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.ARBITRUM_RINKEBY]),
  [SupportedChainId.POLYGON]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.POLYGON]),
  [SupportedChainId.POLYGON_MUMBAI]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.POLYGON_MUMBAI]),
  [SupportedChainId.CELO]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.CELO]),
  [SupportedChainId.CELO_ALFAJORES]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.CELO_ALFAJORES]),
}
