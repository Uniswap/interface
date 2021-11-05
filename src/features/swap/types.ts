import { Token } from '@uniswap/sdk-core'

export type QuoteParams = {
  amountIn?: string
  amountOut?: string
  inAddress?: string
  outAddress?: string
}

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
  route: PoolInRoute[][]
  routeString: string
}

export type TokenInRoute = Pick<Token, 'address' | 'chainId' | 'symbol' | 'decimals'>

export type PoolInRoute = {
  type: 'v3-pool'
  address: string
  tokenIn: TokenInRoute
  tokenOut: TokenInRoute
  sqrtRatioX96: string
  liquidity: string
  tickCurrent: string
  fee: string
  amountIn?: string
  amountOut?: string
}

// End Routing API types
