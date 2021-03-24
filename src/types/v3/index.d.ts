import { BigNumberish } from '@ethersproject/bignumber'
import { basisPointsToPercent } from 'utils'

const FEE_BIPS = {
  FIVE: basisPointsToPercent(5),
  THIRTY: basisPointsToPercent(30),
  ONE_HUNDRED: basisPointsToPercent(100),
}

export interface Position {
  feesEarned: Record<string, BigNumberish>
  feeLevel: FEE_BIPS
  tokenAmount0: TokenAmount
  tokenAmount1: TokenAmount
  tickLower: BigNumberish
  tickUpper: BigNumberish
}
