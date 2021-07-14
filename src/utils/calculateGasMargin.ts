import { BigNumber } from '@ethersproject/bignumber'
import { SupportedChainId } from 'constants/chains'

// add 20% (except on optimism)
export function calculateGasMargin(chainId: number, value: BigNumber): BigNumber {
  return chainId === SupportedChainId.OPTIMISM || chainId === SupportedChainId.OPTIMISTIC_KOVAN
    ? value
    : value.mul(BigNumber.from(10000 + 2000)).div(BigNumber.from(10000))
}
