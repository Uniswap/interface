import { PermitTransferFromData } from '@uniswap/permit2-sdk'
import { Protocol } from '@uniswap/router-sdk'
import { Percent, Token, TradeType } from '@uniswap/sdk-core'
import {
  DutchOrderInfoJSON,
  UnsignedPriorityOrderInfoJSON,
  UnsignedV2DutchOrderInfoJSON,
  UnsignedV3DutchOrderInfoJSON,
} from '@uniswap/uniswapx-sdk'
import { UniverseChainId } from '@universe/chains'
import { RouterPreference, SubmittableTrade } from '~/types/routing'

// Request and response shapes of the unified routing API quote endpoint. Only the quote parser in
// ./routing.ts reads these; the trade classes the rest of the app uses live in ~/types/routing.

export enum URAQuoteType {
  CLASSIC = 'CLASSIC',
  DUTCH_V1 = 'DUTCH_LIMIT', // "dutch limit" refers to dutch. Fully separate from "limit orders"
  DUTCH_V2 = 'DUTCH_V2',
  DUTCH_V3 = 'DUTCH_V3',
  PRIORITY = 'PRIORITY',
}

// This is excluded from `RouterPreference` enum because it's only used
// internally for token -> USDC trades to get a USD value.
export const INTERNAL_ROUTER_PREFERENCE_PRICE = 'price' as const

export interface GetQuoteArgs {
  tokenInAddress: string
  tokenInChainId: UniverseChainId
  tokenInDecimals: number
  tokenInSymbol?: string
  tokenOutAddress: string
  tokenOutChainId: UniverseChainId
  tokenOutDecimals: number
  tokenOutSymbol?: string
  amount: string
  account?: string
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE
  protocolPreferences?: Protocol[]
  tradeType: TradeType
  uniswapXForceSyntheticQuotes: boolean
  sendPortionEnabled: boolean
  routingType: URAQuoteType
}

export type GetQuickQuoteArgs = {
  amount: string
  tokenInAddress: string
  tokenInChainId: UniverseChainId
  tokenInDecimals: number
  tokenInSymbol?: string
  tokenOutAddress: string
  tokenOutChainId: UniverseChainId
  tokenOutDecimals: number
  tokenOutSymbol?: string
  tradeType: TradeType
  inputTax: Percent
  outputTax: Percent
}

// from https://github.com/Uniswap/routing-api/blob/main/lib/handlers/schema.ts
export type TokenInRoute = Pick<Token, 'address' | 'chainId' | 'symbol' | 'decimals'> & {
  buyFeeBps?: string
  sellFeeBps?: string
}

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

// From `ClassicQuoteDataJSON` in https://github.com/Uniswap/unified-routing-api/blob/main/lib/entities/quote/ClassicQuote.ts
export interface ClassicQuoteData {
  requestId?: string
  quoteId?: string
  blockNumber: string
  amount: string
  amountDecimals: string
  gasPriceWei?: string
  gasUseEstimate?: string
  gasUseEstimateQuote?: string
  gasUseEstimateQuoteDecimals?: string
  gasUseEstimateUSD?: string
  methodParameters?: { calldata: string; value: string }
  quote: string
  quoteDecimals: string
  quoteGasAdjusted: string
  quoteGasAdjustedDecimals: string
  route: Array<(V3PoolInRoute | V2PoolInRoute)[]>
  routeString: string
  portionBips?: number
  portionRecipient?: string
  portionAmount?: string
  portionAmountDecimals?: string
  quoteGasAndPortionAdjusted?: string
  quoteGasAndPortionAdjustedDecimals?: string
}

// From `DutchQuoteDataJSON` https://github.com/Uniswap/unified-routing-api/blob/main/lib/entities/quote/DutchQuote.ts
export type URADutchOrderQuoteData = {
  orderInfo: DutchOrderInfoJSON
  quoteId?: string
  requestId?: string
  encodedOrder: string
  orderHash: string
  startTimeBufferSecs: number
  auctionPeriodSecs: number
  deadlineBufferSecs: number
  slippageTolerance: string
  permitData: PermitTransferFromData
  portionBips?: number
  portionAmount?: string
  portionRecipient?: string
}

// From `DutchV2QuoteDataJSON` in https://github.com/Uniswap/unified-routing-api/blob/main/lib/entities/quote/DutchV2Quote.ts
export type URADutchOrderV2QuoteData = {
  orderInfo: UnsignedV2DutchOrderInfoJSON
  quoteId?: string
  requestId?: string
  encodedOrder: string
  orderHash: string
  deadlineBufferSecs: number
  slippageTolerance: string
  permitData: PermitTransferFromData
  portionBips?: number
  portionAmount?: string
  portionRecipient?: string
}

export type URADutchOrderV3QuoteData = {
  orderInfo: UnsignedV3DutchOrderInfoJSON
  encodedOrder: string
  quoteId?: string
  requestId?: string
  orderHash: string
  deadlineBufferSecs: number
  slippageTolerance: string
  permitData: PermitTransferFromData
  portionBips?: number
  portionAmount?: string
  portionRecipient?: string
}

// from `PriorityQuoteDataJSON` in https://github.com/Uniswap/backend/blob/main/packages/services/unified-routing-api/lib/entities/quote/PriorityQuote.ts
export type URAPriorityOrderQuoteData = {
  orderInfo: UnsignedPriorityOrderInfoJSON
  startTimeBufferSecs: number // ignore for priority order
  deadlineBufferSecs: number // ignore for priority order
  amountInMpsPerPriorityFeeWei: number
  amountOutMpsPerPriorityFeeWei: number
  permitData: PermitTransferFromData
  quoteId: string
  requestId: string
  encodedOrder: string
  orderHash: string
  slippageTolerance: string
  portionBips?: number
  portionAmount?: string
  portionRecipient?: string
}

type URADutchOrderQuoteResponse = {
  routing: URAQuoteType.DUTCH_V1
  quote: URADutchOrderQuoteData
  allQuotes: Array<URAQuoteResponse>
}
type URADutchOrderV2QuoteResponse = {
  routing: URAQuoteType.DUTCH_V2
  quote: URADutchOrderV2QuoteData
  allQuotes: Array<URAQuoteResponse>
}
type URADutchOrderV3QuoteResponse = {
  routing: URAQuoteType.DUTCH_V3
  quote: URADutchOrderV3QuoteData
  allQuotes: Array<URAQuoteResponse>
}
type URAClassicQuoteResponse = {
  routing: URAQuoteType.CLASSIC
  quote: ClassicQuoteData
  allQuotes: Array<URAQuoteResponse>
}
type URAPriorityOrderQuoteResponse = {
  routing: URAQuoteType.PRIORITY
  quote: URAPriorityOrderQuoteData
  allQuotes: Array<URAQuoteResponse>
}
export type URAQuoteResponse =
  | URAClassicQuoteResponse
  | URADutchOrderQuoteResponse
  | URADutchOrderV2QuoteResponse
  | URADutchOrderV3QuoteResponse
  | URAPriorityOrderQuoteResponse

export function isClassicQuoteResponse(data: URAQuoteResponse): data is URAClassicQuoteResponse {
  return data.routing === URAQuoteType.CLASSIC
}

export enum QuoteState {
  SUCCESS = 'Success',
  NOT_FOUND = 'Not found',
}

export type TradeResult =
  | {
      state: QuoteState.NOT_FOUND
      trade?: undefined
    }
  | {
      state: QuoteState.SUCCESS
      trade: SubmittableTrade
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
  MON = 'MON',
}
