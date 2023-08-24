import { AlternativeRpcType, ALT_RPC_URLS_BY_CHAIN, ChainId } from 'wallet/src/constants/chains'

export function getInfuraChainName(
  chainId: ChainId
): 'homestead' | 'goerli' | 'arbitrum' | 'base' | 'optimism' | 'matic' | 'maticmum' {
  switch (chainId) {
    case ChainId.Mainnet:
      return 'homestead'
    case ChainId.Goerli:
      return 'goerli'
    case ChainId.ArbitrumOne:
      return 'arbitrum'
    case ChainId.Base:
      return 'base'
    case ChainId.Optimism:
      return 'optimism'
    case ChainId.Polygon:
      return 'matic'
    case ChainId.PolygonMumbai:
      return 'maticmum'
    default:
      throw new Error(`Unsupported eth infura chainId for ${chainId}`)
  }
}

export function isAlternativeRpcSupportedOnChain(
  chainId: ChainId,
  alternativeRpcType: AlternativeRpcType
): boolean {
  return Object.keys(ALT_RPC_URLS_BY_CHAIN[chainId] ?? {}).includes(alternativeRpcType)
}
