import { ChainId } from 'src/constants/chains'

export function getInfuraChainName(chainId: ChainId) {
  switch (chainId) {
    case ChainId.Mainnet:
      return 'homestead'
    case ChainId.Rinkeby:
      return 'rinkeby'
    case ChainId.Ropsten:
      return 'ropsten'
    case ChainId.Goerli:
      return 'goerli'
    case ChainId.Kovan:
      return 'kovan'
    case ChainId.ArbitrumOne:
      return 'arbitrum'
    case ChainId.ArbitrumRinkeby:
      return 'arbitrum-rinkeby'
    case ChainId.Optimism:
      return 'optimism'
    case ChainId.OptimisticKovan:
      return 'optimism-kovan'
    case ChainId.Polygon:
      return 'matic'
    case ChainId.PolygonMumbai:
      return 'maticmum'
    default:
      throw new Error(`Unsupported eth infura chainId for ${chainId}`)
  }
}
