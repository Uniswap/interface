// This is the only file which should instantiate new Providers.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { StaticJsonRpcProvider } from '@ethersproject/providers'

import { SupportedChainId } from './chains'
import { RPC_URLS } from './networks'

class FallbackJsonRpcProvider extends StaticJsonRpcProvider {
  constructor(urls: string[]) {
    super(urls[0])

    // TODO(vm): Implement fallback logic.
  }
}

/**
 * These are the only JsonRpcProviders used directly by the interface.
 */
export const RPC_PROVIDERS: { [key in SupportedChainId]: StaticJsonRpcProvider } = {
  [SupportedChainId.MAINNET]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.MAINNET]),
  [SupportedChainId.RINKEBY]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.RINKEBY]),
  [SupportedChainId.ROPSTEN]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.ROPSTEN]),
  [SupportedChainId.GOERLI]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.GOERLI]),
  [SupportedChainId.KOVAN]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.KOVAN]),
  [SupportedChainId.OPTIMISM]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.OPTIMISM]),
  [SupportedChainId.OPTIMISTIC_KOVAN]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.OPTIMISTIC_KOVAN]),
  [SupportedChainId.ARBITRUM_ONE]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.ARBITRUM_ONE]),
  [SupportedChainId.ARBITRUM_RINKEBY]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.ARBITRUM_RINKEBY]),
  [SupportedChainId.POLYGON]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.POLYGON]),
  [SupportedChainId.POLYGON_MUMBAI]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.POLYGON_MUMBAI]),
  [SupportedChainId.CELO]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.CELO]),
  [SupportedChainId.CELO_ALFAJORES]: new FallbackJsonRpcProvider(RPC_URLS[SupportedChainId.CELO_ALFAJORES]),
}
