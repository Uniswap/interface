import { BigNumberish } from '@ethersproject/bignumber'

export interface Position {
  feesEarned: Record<string, BigNumberish>
  feeLevel: FEE_BIPS
  tokenAmount0: TokenAmount
  tokenAmount1: TokenAmount
  tickLower: BigNumberish
  tickUpper: BigNumberish
}
