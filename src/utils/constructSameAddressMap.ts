import { SupportedChainId } from '../constants/chains'

const DEFAULT_NETWORKS = [
  SupportedChainId.MAINNET,
  // SupportedChainId.ROPSTEN,
  // SupportedChainId.RINKEBY,
  // SupportedChainId.GOERLI,
  // SupportedChainId.KOVAN,
]

export function constructSameAddressMap<T extends string>(
  address: T,
  additionalNetworks: SupportedChainId[] = []
): { [chainId: number]: T } {
  return DEFAULT_NETWORKS.concat(additionalNetworks).reduce<{ [chainId: number]: T }>((memo, chainId) => {
    memo[chainId] = address
    return memo
  }, {})
}
