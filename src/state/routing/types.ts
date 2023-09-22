import { MixedRouteSDK, ONE, Protocol, Trade } from '@uniswap/router-sdk'
import { ChainId, Currency, CurrencyAmount, Fraction, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { DutchOrderInfo, DutchOrderInfoJSON, DutchOrderTrade as IDutchOrderTrade } from '@uniswap/uniswapx-sdk'
import { Route as V2Route } from '@uniswap/v2-sdk'
import { Route as V3Route } from '@uniswap/v3-sdk'

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

// This is excluded from `RouterPreference` enum because it's only used
// internally for token -> USDC trades to get a USD value.
export const INTERNAL_ROUTER_PREFERENCE_PRICE = 'price' as const

export enum RouterPreference {
  X = 'uniswapx',
  API = 'api',
  CLIENT = 'client',
}

export interface GetQuoteArgs {
  tokenInAddress: string
  tokenInChainId: ChainId
  tokenInDecimals: number
  tokenInSymbol?: string
  tokenOutAddress: string
  tokenOutChainId: ChainId
  tokenOutDecimals: number
  tokenOutSymbol?: string
  amount: string
  account?: string
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE
  tradeType: TradeType
  needsWrapIfUniswapX: boolean
  uniswapXForceSyntheticQuotes: boolean
  uniswapXEthOutputEnabled: boolean
  uniswapXExactOutputEnabled: boolean
  // legacy field indicating the user disabled UniswapX during the opt-in period, or dismissed the UniswapX opt-in modal.
  userDisabledUniswapX: boolean
  // temporary field indicating the user disabled UniswapX during the transition to the opt-out model
  userOptedOutOfUniswapX: boolean
  isUniswapXDefaultEnabled: boolean
  inputTax: Percent
  outputTax: Percent
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
  requestId?: string
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

type URADutchOrderQuoteResponse = {
  routing: URAQuoteType.DUTCH_LIMIT
  quote: {
    auctionPeriodSecs: number
    deadlineBufferSecs: number
    startTimeBufferSecs: number
    orderInfo: DutchOrderInfoJSON
    quoteId?: string
    requestId?: string
    slippageTolerance: string
  }
  allQuotes: Array<URAQuoteResponse>
}
type URAClassicQuoteResponse = {
  routing: URAQuoteType.CLASSIC
  quote: ClassicQuoteData
  allQuotes: Array<URAQuoteResponse>
}
export type URAQuoteResponse = URAClassicQuoteResponse | URADutchOrderQuoteResponse

export function isClassicQuoteResponse(data: URAQuoteResponse): data is URAClassicQuoteResponse {
  return data.routing === URAQuoteType.CLASSIC
}

export enum TradeFillType {
  Classic = 'classic', // Uniswap V1, V2, and V3 trades with on-chain routes
  UniswapX = 'uniswap_x', // off-chain trades, no routes
}

export type ApproveInfo = { needsApprove: true; approveGasEstimateUSD: number } | { needsApprove: false }
export type WrapInfo = { needsWrap: true; wrapGasEstimateUSD: number } | { needsWrap: false }

export class ClassicTrade extends Trade<Currency, Currency, TradeType> {
  public readonly fillType = TradeFillType.Classic
  approveInfo: ApproveInfo
  gasUseEstimateUSD?: number // gas estimate for swaps
  blockNumber: string | null | undefined
  isUniswapXBetter: boolean | undefined
  requestId: string | undefined
  quoteMethod: QuoteMethod
  inputTax: Percent
  outputTax: Percent

  constructor({
    gasUseEstimateUSD,
    blockNumber,
    isUniswapXBetter,
    requestId,
    quoteMethod,
    approveInfo,
    inputTax,
    outputTax,
    ...routes
  }: {
    gasUseEstimateUSD?: number
    totalGasUseEstimateUSD?: number
    blockNumber?: string | null
    isUniswapXBetter?: boolean
    requestId?: string
    quoteMethod: QuoteMethod
    approveInfo: ApproveInfo
    inputTax: Percent
    outputTax: Percent
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
    this.isUniswapXBetter = isUniswapXBetter
    this.requestId = requestId
    this.quoteMethod = quoteMethod
    this.approveInfo = approveInfo
    this.inputTax = inputTax
    this.outputTax = outputTax
  }

  public get totalTaxRate(): Percent {
    return this.inputTax.add(this.outputTax)
  }

  public get postTaxOutputAmount() {
    // Ideally we should calculate the final output amount by ammending the inputAmount based on the input tax and then applying the output tax,
    // but this isn't currently possible because V2Trade reconstructs the total inputAmount based on the swap routes
    // TODO(WEB-2761): Amend V2Trade objects in the v2-sdk to have a separate field for post-input tax routes
    return this.outputAmount.multiply(new Fraction(ONE).subtract(this.totalTaxRate))
  }

  public minimumAmountOut(slippageTolerance: Percent, amountOut = this.outputAmount): CurrencyAmount<Currency> {
    // Since universal-router-sdk reconstructs V2Trade objects, overriding this method does not actually change the minimumAmountOut that gets submitted on-chain
    // Our current workaround is to add tax rate to slippage tolerance before we submit the trade to universal-router-sdk in useUniversalRouter.ts
    // So the purpose of this override is so the UI displays the same minimum amount out as what is submitted on-chain
    return super.minimumAmountOut(slippageTolerance.add(this.totalTaxRate), amountOut)
  }

  // gas estimate for maybe approve + swap
  public get totalGasUseEstimateUSD(): number | undefined {
    if (this.approveInfo.needsApprove && this.gasUseEstimateUSD) {
      return this.approveInfo.approveGasEstimateUSD + this.gasUseEstimateUSD
    }

    return this.gasUseEstimateUSD
  }
}

export class DutchOrderTrade extends IDutchOrderTrade<Currency, Currency, TradeType> {
  public readonly fillType = TradeFillType.UniswapX
  quoteId?: string
  requestId?: string
  wrapInfo: WrapInfo
  approveInfo: ApproveInfo
  // The gas estimate of the reference classic trade, if there is one.
  classicGasUseEstimateUSD?: number
  auctionPeriodSecs: number
  startTimeBufferSecs: number
  deadlineBufferSecs: number
  slippageTolerance: Percent

  constructor({
    currencyIn,
    currenciesOut,
    orderInfo,
    tradeType,
    quoteId,
    requestId,
    wrapInfo,
    approveInfo,
    classicGasUseEstimateUSD,
    auctionPeriodSecs,
    startTimeBufferSecs,
    deadlineBufferSecs,
    slippageTolerance,
  }: {
    currencyIn: Currency
    currenciesOut: Currency[]
    orderInfo: DutchOrderInfo
    tradeType: TradeType
    quoteId?: string
    requestId?: string
    approveInfo: ApproveInfo
    wrapInfo: WrapInfo
    classicGasUseEstimateUSD?: number
    auctionPeriodSecs: number
    startTimeBufferSecs: number
    deadlineBufferSecs: number
    slippageTolerance: Percent
  }) {
    super({ currencyIn, currenciesOut, orderInfo, tradeType })
    this.quoteId = quoteId
    this.requestId = requestId
    this.approveInfo = approveInfo
    this.wrapInfo = wrapInfo
    this.classicGasUseEstimateUSD = classicGasUseEstimateUSD
    this.auctionPeriodSecs = auctionPeriodSecs
    this.deadlineBufferSecs = deadlineBufferSecs
    this.slippageTolerance = slippageTolerance
    this.startTimeBufferSecs = startTimeBufferSecs
  }

  public get totalGasUseEstimateUSD(): number {
    if (this.wrapInfo.needsWrap && this.approveInfo.needsApprove) {
      return this.wrapInfo.wrapGasEstimateUSD + this.approveInfo.approveGasEstimateUSD
    }

    if (this.wrapInfo.needsWrap) return this.wrapInfo.wrapGasEstimateUSD
    if (this.approveInfo.needsApprove) return this.approveInfo.approveGasEstimateUSD

    return 0
  }

  /** For UniswapX, handling token taxes in the output amount is outsourced to quoters */
  public get postTaxOutputAmount() {
    return this.outputAmount
  }
}

export type InterfaceTrade = ClassicTrade | DutchOrderTrade

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
      latencyMs?: number
    }
  | {
      state: QuoteState.SUCCESS
      trade: InterfaceTrade
      latencyMs?: number
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

export enum URAQuoteType {
  CLASSIC = 'CLASSIC',
  DUTCH_LIMIT = 'DUTCH_LIMIT',
}

type ClassicAPIConfig = {
  protocols: Protocol[]
}

type UniswapXConfig = {
  swapper?: string
  exclusivityOverrideBps?: number
  auctionPeriodSecs?: number
  startTimeBufferSecs?: number
}

export type RoutingConfig = (UniswapXConfig | ClassicAPIConfig)[]
