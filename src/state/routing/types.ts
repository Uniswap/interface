import { MixedRouteSDK, Trade } from '@thinkincoin/router-sdk'
import { Currency, CurrencyAmount, Token, TradeType } from '@thinkincoin-libs/sdk-core'
import { Route as V2Route } from '@thinkincoin-libs/uniswap-v2-sdk'
import { Route as V3Route } from '@thinkincoin-libs/uniswap-v3-sdk'

import { RouterPreference } from './slice'

export enum TradeState {
  LOADING,
  INVALID,
  STALE,
  NO_ROUTE_FOUND,
  VALID,
}

export enum QuoteMethod {
  ROUTING_API = 'ROUTING_API',
  CLIENT_SIDE = 'CLIENT_SIDE',
  CLIENT_SIDE_FALLBACK = 'CLIENT_SIDE_FALLBACK', // If client-side was used after the routing-api call failed.
}

// from https://github.com/Uniswap/routing-api/blob/main/lib/handlers/schema.ts

type TokenInRoute = Pick<Token, 'address' | 'chainId' | 'symbol' | 'decimals'>

export type V3PoolInRoute = {
  type: 'v3-pool'
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

type V2Reserve = {
  token: TokenInRoute
  quotient: string
}

export type V2PoolInRoute = {
  type: 'v2-pool'
  tokenIn: TokenInRoute
  tokenOut: TokenInRoute
  reserve0: V2Reserve
  reserve1: V2Reserve
  amountIn?: string
  amountOut?: string

  // not used in the interface
  // avoid returning it from the client-side smart-order-router
  address?: string
}

export interface QuoteData {
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
}

export type QuoteReponse = {
  routing: RouterPreference.API
  quote: QuoteData
}

export class ClassicTrade<
  TInput extends Currency,
  TOutput extends Currency,
  TTradeType extends TradeType
> extends Trade<TInput, TOutput, TTradeType> {
  gasUseEstimateUSD: string | null | undefined
  blockNumber: string | null | undefined

  constructor({
    gasUseEstimateUSD,
    blockNumber,
    ...routes
  }: {
    gasUseEstimateUSD?: string | null
    blockNumber?: string | null
    v2Routes: {
      routev2: V2Route<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    v3Routes: {
      routev3: V3Route<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    tradeType: TTradeType
    mixedRoutes?: {
      mixedRoute: MixedRouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
  }) {
    super(routes)
    this.blockNumber = blockNumber
    this.gasUseEstimateUSD = gasUseEstimateUSD
  }
}

export type InterfaceTrade = ClassicTrade<Currency, Currency, TradeType>

export enum QuoteState {
  SUCCESS = 'Success',
  NOT_FOUND = 'Not found',
}

export type QuoteResult =
  | {
      state: QuoteState.NOT_FOUND
      data?: undefined
    }
  | {
      state: QuoteState.SUCCESS
      data: QuoteData
    }

export type TradeResult =
  | {
      state: QuoteState.NOT_FOUND
      trade?: undefined
      method?: QuoteMethod
    }
  | {
      state: QuoteState.SUCCESS
      trade: InterfaceTrade
      method?: QuoteMethod
    }

export enum PoolType {
  V2Pool = 'v2-pool',
  V3Pool = 'v3-pool',
}

// swap router API special cases these strings to represent native currencies
// all chains except for bnb chain and polygon
// have "ETH" as native currency symbol
export enum SwapRouterNativeAssets {
  MATIC = 'MATIC',
  BNB = 'BNB',
  AVAX = 'AVAX',
  ETH = 'ETH',
}
