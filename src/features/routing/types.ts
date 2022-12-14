import { Token } from '@uniswap/sdk-core'
import { Trade } from 'src/features/transactions/swap/useTrade'

// Routing API types

export interface QuoteResult {
  quoteId?: string
  blockNumber: string
  amount: string
  amountDecimals: string
  gasPriceWei: string
  gasUseEstimate: string
  gasUseEstimateQuote: string
  gasUseEstimateQuoteDecimals: string
  gasUseEstimateUSD: string
  methodParameters?: { calldata: string; value: string }
  quote: string
  quoteDecimals: string
  quoteGasAdjusted: string
  quoteGasAdjustedDecimals: string
  route: Array<(V3PoolInRoute | V2PoolInRoute)[]>
  routeString: string
  simulationError?: boolean
}

export interface TradeQuoteResult {
  trade: Trade
  simulationError?: boolean
  gasUseEstimate: string
}

export type TokenInRoute = Pick<Token, 'address' | 'chainId' | 'symbol' | 'decimals'>

export enum PoolType {
  V2Pool = 'v2-pool',
  V3Pool = 'v3-pool',
}

export type V3PoolInRoute = {
  type: PoolType.V3Pool
  tokenIn: TokenInRoute
  tokenOut: TokenInRoute
  sqrtRatioX96: string
  liquidity: string
  tickCurrent: string
  fee: string
  amountIn?: string
  amountOut?: string

  // no used in the interface
  address?: string
}

export type V2Reserve = {
  token: TokenInRoute
  quotient: string
}

export type V2PoolInRoute = {
  type: PoolType.V2Pool
  tokenIn: TokenInRoute
  tokenOut: TokenInRoute
  reserve0: V2Reserve
  reserve1: V2Reserve
  amountIn?: string
  amountOut?: string

  // no used in the interface
  // avoid returning it from the client-side smart-order-router
  address?: string
}

// End Routing API types
