import { SupportedL1ChainId, SupportedL2ChainId } from '../constants/chains'

const MAINNET_AND_TESTNETS: (SupportedL1ChainId | SupportedL2ChainId)[] = [
  SupportedL1ChainId.MAINNET,
  SupportedL1ChainId.ROPSTEN,
  SupportedL1ChainId.RINKEBY,
  SupportedL1ChainId.GOERLI,
  SupportedL1ChainId.KOVAN,
]

export function constructSameAddressMap<T extends string>(
  address: T,
  additionalNetworks: (SupportedL1ChainId | SupportedL2ChainId)[] = []
): { [chainId: number]: T } {
  return MAINNET_AND_TESTNETS.concat(additionalNetworks).reduce<{ [chainId: number]: T }>((memo, chainId) => {
    memo[chainId] = address
    return memo
  }, {})
}
