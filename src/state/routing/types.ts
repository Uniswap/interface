import {
  DutchLimitOrderInfo,
  DutchLimitOrderInfoJSON,
  DutchLimitOrderTrade as IDutchLimitOrderTrade,
} from '@uniswap/gouda-sdk'
import { MixedRouteSDK, Protocol, Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Route as V2Route } from '@uniswap/v2-sdk'
import { Route as V3Route } from '@uniswap/v3-sdk'

export enum TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
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

export interface ClassicQuoteData {
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

type DutchLimitOrderInfoData = DutchLimitOrderInfoJSON & { quoteId?: string }
type URADutchLimitOrderQuoteResponse = {
  routing: URAQuoteType.DUTCH_LIMIT
  quote: DutchLimitOrderInfoData
  allQuotes: Array<URAQuoteResponse>
}
type URAClassicQuoteResponse = {
  routing: URAQuoteType.CLASSIC
  quote: ClassicQuoteData
  allQuotes: Array<URAQuoteResponse>
}
export type URAQuoteResponse = URAClassicQuoteResponse | URADutchLimitOrderQuoteResponse

export function isClassicQuoteResponse(data: URAQuoteResponse): data is URAClassicQuoteResponse {
  return data.routing === URAQuoteType.CLASSIC
}

export enum TradeFillType {
  Classic = 'classic', // Uniswap V1, V2, and V3 trades with on-chain routes
  UniswapX = 'uniswap_x', // off-chain trades, no routes
}

export class ClassicTrade extends Trade<Currency, Currency, TradeType> {
  public readonly fillType = TradeFillType.Classic
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
      routev2: V2Route<Currency, Currency>
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
    v3Routes: {
      routev3: V3Route<Currency, Currency>
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
    tradeType: TradeType
    mixedRoutes?: {
      mixedRoute: MixedRouteSDK<Currency, Currency>
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
  }) {
    super(routes)
    this.blockNumber = blockNumber
    this.gasUseEstimateUSD = gasUseEstimateUSD
  }
}

export class DutchLimitOrderTrade extends IDutchLimitOrderTrade<Currency, Currency, TradeType> {
  public readonly fillType = TradeFillType.UniswapX
  quoteId?: string
  needsWrap: boolean
  // The gas estimate of the reference classic trade, if there is one.
  gasUseEstimateUSD: string | null | undefined

  constructor({
    currencyIn,
    currenciesOut,
    orderInfo,
    tradeType,
    quoteId,
    needsWrap,
    gasUseEstimateUSD,
  }: {
    currencyIn: Currency
    currenciesOut: Currency[]
    orderInfo: DutchLimitOrderInfo
    tradeType: TradeType
    quoteId?: string
    needsWrap: boolean
    gasUseEstimateUSD?: string | null
  }) {
    super({ currencyIn, currenciesOut, orderInfo, tradeType })
    this.quoteId = quoteId
    this.needsWrap = needsWrap
    this.gasUseEstimateUSD = gasUseEstimateUSD
  }
}

export type InterfaceTrade = ClassicTrade | DutchLimitOrderTrade

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
      data: URAQuoteResponse
    }

export type TradeResult =
  | {
      state: QuoteState.NOT_FOUND
      trade?: undefined
    }
  | {
      state: QuoteState.SUCCESS
      trade: InterfaceTrade
    }

export enum PoolType {
  V2Pool = 'v2-pool',
  V3Pool = 'v3-pool',
}

// swap router API special cases these strings to represent native currencies
// all chains have "ETH" as native currency symbol except for polygon
export enum SwapRouterNativeAssets {
  MATIC = 'MATIC',
  ETH = 'ETH',
}

export enum URAQuoteType {
  CLASSIC = 'CLASSIC',
  DUTCH_LIMIT = 'DUTCH_LIMIT',
}

type ClassicAPIConfig = {
  protocols: Protocol[]
}

type GoudaDutchLimitConfig = {
  offerer?: string
  exclusivityOverrideBps?: number
  auctionPeriodSecs?: number
}

export type RoutingConfig = (GoudaDutchLimitConfig | ClassicAPIConfig)[]
