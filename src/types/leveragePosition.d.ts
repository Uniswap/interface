import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'

export interface LeveragePositionDetails {
  leverageManagerAddress: string | undefined
  borrowManagerAddress: string | undefined
  isBorrow: boolean
  token0Address: string | undefined
  token1Address: string | undefined
  poolFee: FeeAmount | undefined
  tokenId: string
  totalPosition: string // totalPosition
  totalDebt: string // total debt in output token
  totalDebtInput: string // total debt in input token
  initialCollateral: string
  // creationPrice: string,
  recentPremium: string
  totalPremium: string,
  unusedPremium: string,
  isToken0: boolean
  openTime: string
  repayTime: string
  // borrowInfo: TickLiquidity[]
}
// open price == ( totalDebtInput + initialCollateral ) / totalPosition

interface TickLiquidity {
  tick: number,
  liquidity: string
}
