import { ChainId } from 'src/constants/chains'

export function getInfuraChainName(chainId: ChainId) {
  switch (chainId) {
    case ChainId.MAINNET:
      return 'homestead'
    case ChainId.RINKEBY:
      return 'rinkeby'
    case ChainId.ROPSTEN:
      return 'ropsten'
    case ChainId.GOERLI:
      return 'goerli'
    case ChainId.KOVAN:
      return 'kovan'
    case ChainId.ARBITRUM_ONE:
      return 'arbitrum'
    case ChainId.ARBITRUM_RINKEBY:
      return 'arbitrum-rinkeby'
    case ChainId.OPTIMISM:
      return 'optimism'
    case ChainId.OPTIMISTIC_KOVAN:
      return 'optimism-kovan'
    default:
      throw new Error(`Unsupported eth infura chainId for ${chainId}`)
  }
}
