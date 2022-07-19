import { Currency, Token } from '@uniswap/sdk-core'

export type OrderInQuote = {
  makerToken: string
  makerAmount: string
  takerToken: string
  takerAmount: string
}

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
  allowanceTarget: string
}

export interface GetValidatorQuoteResult {
  to: string
  data: string
  value: string
  estimatedGas: string

  buyTokenAddress: string
  buyAmount: string

  sellTokenAddress: string
  sellAmount: string

  allowanceTarget: string
  uniswapAmount: string
}

export interface GetValidatorGaslessQuoteResult {
  quote: GetValidatorQuoteResult
  paymentTokenAddress: string
  paymentFee: number
}
