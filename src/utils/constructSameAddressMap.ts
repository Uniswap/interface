import { SupportedChainId } from '../constants/chains'

export function constructSameAddressMap<T extends string>(
  address: T,
  includeArbitrum: boolean
): { [chainId: number]: T } {
  if (includeArbitrum)
    return {
      [SupportedChainId.MAINNET]: address,
      [SupportedChainId.ROPSTEN]: address,
      [SupportedChainId.RINKEBY]: address,
      [SupportedChainId.GOERLI]: address,
      [SupportedChainId.KOVAN]: address,
      [SupportedChainId.ARBITRUM_ONE]: address,
    }
  return {
    [SupportedChainId.MAINNET]: address,
    [SupportedChainId.ROPSTEN]: address,
    [SupportedChainId.RINKEBY]: address,
    [SupportedChainId.GOERLI]: address,
    [SupportedChainId.KOVAN]: address,
  }
}
