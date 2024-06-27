import { ChainId, RPCType } from 'uniswap/src/types/chains'
import { CHAIN_INFO } from 'wallet/src/constants/chains'

// Should match supported chains in `InfuraProvider` class within `getUrl` method
export type InfuraChainName =
  | 'homestead'
  | 'goerli'
  | 'arbitrum'
  | 'base'
  | 'bnbsmartchain-mainnet'
  | 'optimism'
  | 'matic'
  | 'maticmum'
  | 'blast'
  | 'avalanche-mainnet'
  | 'celo-mainnet'

export function getInfuraChainName(chainId: ChainId): InfuraChainName {
  switch (chainId) {
    case ChainId.Mainnet:
      return 'homestead'
    case ChainId.Goerli:
      return 'goerli'
    case ChainId.ArbitrumOne:
      return 'arbitrum'
    case ChainId.Base:
      return 'base'
    case ChainId.Bnb:
      return 'bnbsmartchain-mainnet'
    case ChainId.Optimism:
      return 'optimism'
    case ChainId.Polygon:
      return 'matic'
    case ChainId.PolygonMumbai:
      return 'maticmum'
    case ChainId.Blast:
      return 'blast'
    case ChainId.Avalanche:
      return 'avalanche-mainnet'
    case ChainId.Celo:
      return 'celo-mainnet'
    default:
      throw new Error(`Unsupported eth infura chainId for ${chainId}`)
  }
}

export function isPrivateRpcSupportedOnChain(chainId: ChainId): boolean {
  return Boolean(CHAIN_INFO[chainId]?.rpcUrls?.[RPCType.Private])
}
