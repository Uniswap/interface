import { Token } from '@uniswap/sdk-core'

export enum V3TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  SYNCING,
}

export type TokenInRoute = Pick<Token, 'address' | 'name' | 'symbol' | 'decimals'>

export type SwapTransaction = {
  from: string
  to: string
  data: string
  value: string
  gas: string
  type: number
  gasUseEstimateUSD: string
}

export type PoolInRoute = {
  name: string
  part: string
  fromTokenAddress: string
  toTokenAddress: string
}

export interface GetSwapInchResult {
  fromToken: TokenInRoute
  fromTokenAmount: string
  toToken: TokenInRoute
  toTokenAmount: string
  protocols: PoolInRoute[][][]
  tx: SwapTransaction
}

export interface GetQuoteInchResult {
  fromToken: TokenInRoute
  fromTokenAmount: string
  toToken: TokenInRoute
  toTokenAmount: string
  protocols: PoolInRoute[][][]
  estimatedGas: string
}
