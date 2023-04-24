import { ChainId } from 'src/constants/chains'

export function getInfuraChainName(
  chainId: ChainId
): 'homestead' | 'goerli' | 'arbitrum' | 'optimism' | 'matic' | 'maticmum' {
  switch (chainId) {
    case ChainId.Mainnet:
      return 'homestead'
    case ChainId.Goerli:
      return 'goerli'
    case ChainId.ArbitrumOne:
      return 'arbitrum'
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
