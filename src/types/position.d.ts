import { BigNumber } from '@ethersproject/bignumber'

export interface PositionDetails {
  nonce: BigNumber
  tokenId: BigNumber
  poolId: string
  operator: string
  tickLower: number
  tickUpper: number
  liquidity: BigNumber
  feeGrowthInsideLast: BigNumber
  rTokenOwed: BigNumber
  token0: string
  token1: string
  fee: number
}
