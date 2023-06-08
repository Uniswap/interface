import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'

export interface LimitlessPositionDetails {
  leverageManagerAddress: string | undefined
  borrowManagerAddress: string | undefined
  isBorrow: boolean
  token0Address: string | undefined
  token1Address: string | undefined
  poolFee: FeeAmount | undefined
  tokenId: string
  totalPosition: number // totalPosition
  totalDebt: number // total debt in output token
  totalDebtInput: number // total debt in input token
  initialCollateral: number
  // creationPrice: string,
  recentPremium: number
  totalPremium: number,
  unusedPremium: number,
  isToken0: boolean
  openTime: number
  repayTime: number
  totalPositionRaw?:string;
  // borrowInfo: TickLiquidity[]
}
// open price == ( totalDebtInput + initialCollateral ) / totalPosition

interface TickLiquidity {
  tick: number,
  liquidity: string
}
