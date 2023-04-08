import { BigNumber } from '@ethersproject/bignumber'

export interface LeveragePositionDetails {
  token0: string
  token1: string
  tokenId: BigNumber
  totalLiquidity: BigNumber // totalPosition
  totalDebt: BigNumber // total debt in output token
  totalDebtInput: BigNumber // total debt in input token
  borrowedLiquidity: BigNumber
  isToken0: boolean
  openBlock: number
  tickStart: number // borrowStartTick
  tickFinish: number // borrowFinishTick
  timeUntilFinish: number // 24hr - timeElapsedSinceInterestPaid
}