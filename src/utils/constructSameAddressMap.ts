import { ChainId } from 'constants/chains'

export function constructSameAddressMap<T extends string>(address: T): { [chainId in ChainId]: T } {
  return {
    [ChainId.MAINNET]: address,
    [ChainId.TESTNET]: address,
  }
}
