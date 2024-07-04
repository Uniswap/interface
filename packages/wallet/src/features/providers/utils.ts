import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { RPCType, UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'

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

export function getInfuraChainName(chainId: WalletChainId): InfuraChainName {
  switch (chainId) {
    case UniverseChainId.Mainnet:
      return 'homestead'
    case UniverseChainId.Goerli:
      return 'goerli'
    case UniverseChainId.ArbitrumOne:
      return 'arbitrum'
    case UniverseChainId.Base:
      return 'base'
    case UniverseChainId.Bnb:
      return 'bnbsmartchain-mainnet'
    case UniverseChainId.Optimism:
      return 'optimism'
    case UniverseChainId.Polygon:
      return 'matic'
    case UniverseChainId.PolygonMumbai:
      return 'maticmum'
    case UniverseChainId.Blast:
      return 'blast'
    case UniverseChainId.Avalanche:
      return 'avalanche-mainnet'
    case UniverseChainId.Celo:
      return 'celo-mainnet'
    default:
      throw new Error(`Unsupported eth infura chainId for ${chainId}`)
  }
}

export function isPrivateRpcSupportedOnChain(chainId: WalletChainId): boolean {
  return Boolean(UNIVERSE_CHAIN_INFO[chainId]?.rpcUrls?.[RPCType.Private])
}
