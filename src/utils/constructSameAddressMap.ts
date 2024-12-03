import { ChainId } from '@uniswap/sdk-core'

export function constructSameAddressMap<T extends string>(
  address: T,
  additionalNetworks: ChainId[] = []
): { [chainId: number]: T } {
  return {
    [ChainId.MAINNET]: address,
    [ChainId.ROPSTEN]: address,
    [ChainId.RINKEBY]: address,
    [ChainId.GÖRLI]: address,
    [ChainId.KOVAN]: address,
    [ChainId.POLYGON_AMOY]: address,
    ...additionalNetworks.reduce<{ [chainId: number]: T }>((memo, chainId) => {
      memo[chainId] = address
      return memo
    }, {}),
  }
}
