import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk-core'

export interface LeveragePositionDetails {
  leverageManagerAddress: string | undefined
  token0: Token | undefined
  token1: Token | undefined
  tokenId: string
  totalLiquidity: string // totalPosition
  totalDebt: string // total debt in output token
  totalDebtInput: string // total debt in input token
  borrowedLiquidity: string
  creationTick: string
  isToken0: boolean
  openTime: string
  repayTime: string
  tickStart: string // borrowStartTick
  tickFinish: string // borrowFinishTick
}
// uint256 totalPosition; //position in output tokenx
//         uint256 totalDebt; // debt in output token
//         uint256 totalDebtInput; //debt in input token
//         int24 creationTick;
//         uint128 borrowedLiq;
//         bool isToken0; //if output position is in token0
//         uint32 openTime;
//         uint32 repayTime; // this is refreshed when trader replenish interest
//         int24 borrowStartTick;
//         int24 borrowFinishTick;