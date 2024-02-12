import { Token } from '@uniswap/sdk-core'
import { ChainId } from 'wallet/src/constants/chains'
import { Trade } from 'wallet/src/features/transactions/swap/trade/types'

// Routing API types
export enum RouterPreference {
  AUTO = 'auto',
  API = 'api',
  CLIENT = 'client',
}

export interface QuoteRequest {
  tokenInChainId: ChainId
  tokenIn: string
  tokenOutChainId: ChainId
  tokenOut: string
  amount: string
  type: 'EXACT_INPUT' | 'EXACT_OUTPUT'
  configs: [
    {
      protocols: string[]
      routingType: 'CLASSIC'
      enableUniversalRouter: boolean
      enableFeeOnTransferFeeFetching: boolean
      recipient?: string
      slippageTolerance?: number
      deadline?: number
      simulateFromAddress?: string
      permitSignature?: string
      permitAmount?: string
      permitExpiration?: string
      permitSigDeadline?: string
      permitNonce?: string
    }
  ]
  sendPortionEnabled?: boolean
}

export type QuoteResponse = {
  // This can be null when there's a 404.
  routing: RouterPreference.API | null
  // This can be null when there's a 404.
  quote: QuoteResult | null
  timestamp: number // used as a cache ttl
}

export interface QuoteResult {
  quoteId?: string
  requestId?: string
  blockNumber: string
  amount: string
  amountDecimals: string
  gasPriceWei: string
  gasUseEstimate: string
  gasUseEstimateQuote: string
  gasUseEstimateQuoteDecimals: string
  gasUseEstimateUSD: string
  quote: string
  quoteDecimals: string
  quoteGasAdjusted: string
  quoteGasAdjustedDecimals: string
  route: Array<(V3PoolInRoute | V2PoolInRoute)[]>
  routeString: string
  simulationError?: boolean
  portionBips?: number
  portionRecipient?: string
  portionAmount?: string
  portionAmountDecimals?: string
  quoteGasAndPortionAdjusted?: string
  quoteGasAndPortionAdjustedDecimals?: string
}

export interface TradeQuoteResult {
  trade: Trade
  simulationError?: boolean
  gasUseEstimate: string
}

export type TokenInRoute = Pick<Token, 'address' | 'chainId' | 'symbol' | 'decimals' | 'name'> & {
  buyFeeBps?: string
  sellFeeBps?: string
}

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

  // not used in the interface
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
