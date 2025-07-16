import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const chainInfo = getChainInfo(UniverseChainId.SmartBCH)

export type PositionContractResponse = [
  BigInt,
  string,
  string,
  string,
  number,
  number,
  number,
  BigInt,
  BigInt,
  BigInt,
  BigInt,
  BigInt,
]
