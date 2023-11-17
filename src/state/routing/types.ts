import { MixedRouteSDK, ONE, Protocol, Trade } from '@uniswap/router-sdk'
import { ChainId, Currency, CurrencyAmount, Fraction, Percent, Price, Token, TradeType } from '@uniswap/sdk-core'
import { DutchOrderInfo, DutchOrderInfoJSON, DutchOrderTrade as IDutchOrderTrade } from '@uniswap/uniswapx-sdk'
import { Route as V2Route } from '@uniswap/v2-sdk'
import { Route as V3Route } from '@uniswap/v3-sdk'
import { ZERO_PERCENT } from 'constants/misc'

export enum TradeState {
  LOADING = 'loading',
  INVALID = 'invalid',
  STALE = 'stale',
  NO_ROUTE_FOUND = 'no_route_found',
  VALID = 'valid',
}

export enum QuoteMethod {
  ROUTING_API = 'ROUTING_API',
  QUICK_ROUTE = 'QUICK_ROUTE',
  CLIENT_SIDE_FALLBACK = 'CLIENT_SIDE_FALLBACK', // If client-side was used after the routing-api call failed.
}

// This is excluded from `RouterPreference` enum because it's only used
// internally for token -> USDC trades to get a USD value.
export const INTERNAL_ROUTER_PREFERENCE_PRICE = 'price' as const

export enum RouterPreference {
  X = 'uniswapx',
  API = 'api',
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
  sendPortionEnabled: boolean
}

export type GetQuickQuoteArgs = {
  amount: string
  tokenInAddress: string
  tokenInChainId: ChainId
  tokenInDecimals: number
  tokenInSymbol?: string
  tokenOutAddress: string
  tokenOutChainId: ChainId
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

export interface ClassicQuoteData {
  quoteId?: string
  requestId?: string
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

export type URADutchOrderQuoteData = {
  auctionPeriodSecs: number
  deadlineBufferSecs: number
  startTimeBufferSecs: number
  orderInfo: DutchOrderInfoJSON
  quoteId?: string
  requestId?: string
  slippageTolerance: string
  portionBips?: number
  portionRecipient?: string
  portionAmount?: string
}

type URADutchOrderQuoteResponse = {
  routing: URAQuoteType.DUTCH_LIMIT
  quote: URADutchOrderQuoteData
  allQuotes: Array<URAQuoteResponse>
}
type URAClassicQuoteResponse = {
  routing: URAQuoteType.CLASSIC
  quote: ClassicQuoteData
  allQuotes: Array<URAQuoteResponse>
}
export type URAQuoteResponse = URAClassicQuoteResponse | URADutchOrderQuoteResponse

export type QuickRouteResponse = {
  tokenIn: {
    address: string
    decimals: number
    symbol: string
    name: string
  }
  tokenOut: {
    address: string
    decimals: number
    symbol: string
    name: string
  }
  tradeType: 'EXACT_IN' | 'EXACT_OUT'
  quote: {
    amount: string
    path: string
  }
}

export function isClassicQuoteResponse(data: URAQuoteResponse): data is URAClassicQuoteResponse {
  return data.routing === URAQuoteType.CLASSIC
}

export enum TradeFillType {
  Classic = 'classic', // Uniswap V1, V2, and V3 trades with on-chain routes
  UniswapX = 'uniswap_x', // off-chain trades, no routes
  None = 'none', // for preview trades, cant be used for submission
}

export type ApproveInfo = { needsApprove: true; approveGasEstimateUSD: number } | { needsApprove: false }
export type WrapInfo = { needsWrap: true; wrapGasEstimateUSD: number } | { needsWrap: false }

export type SwapFeeInfo = { recipient: string; percent: Percent; amount: string /* raw amount of output token */ }

export class ClassicTrade extends Trade<Currency, Currency, TradeType> {
  public readonly fillType = TradeFillType.Classic
  approveInfo: ApproveInfo
  gasUseEstimateUSD?: number // gas estimate for swaps
  blockNumber: string | null | undefined
  requestId: string | undefined
  quoteMethod: QuoteMethod
  swapFee: SwapFeeInfo | undefined

  constructor({
    gasUseEstimateUSD,
    blockNumber,
    requestId,
    quoteMethod,
    approveInfo,
    swapFee,
    ...routes
  }: {
    gasUseEstimateUSD?: number
    totalGasUseEstimateUSD?: number
    blockNumber?: string | null
    requestId?: string
    quoteMethod: QuoteMethod
    approveInfo: ApproveInfo
    swapFee?: SwapFeeInfo
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
    this.requestId = requestId
    this.quoteMethod = quoteMethod
    this.approveInfo = approveInfo
    this.swapFee = swapFee
  }

  public get executionPrice(): Price<Currency, Currency> {
    if (this.tradeType === TradeType.EXACT_INPUT || !this.swapFee) return super.executionPrice

    // Fix inaccurate price calculation for exact output trades
    return new Price({ baseAmount: this.inputAmount, quoteAmount: this.postSwapFeeOutputAmount })
  }

  public get postSwapFeeOutputAmount(): CurrencyAmount<Currency> {
    // Routing api already applies the swap fee to the output amount for exact-in
    if (this.tradeType === TradeType.EXACT_INPUT) return this.outputAmount

    const swapFeeAmount = CurrencyAmount.fromRawAmount(this.outputAmount.currency, this.swapFee?.amount ?? 0)
    return this.outputAmount.subtract(swapFeeAmount)
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

  inputTax = ZERO_PERCENT
  outputTax = ZERO_PERCENT
  swapFee: SwapFeeInfo | undefined

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
    swapFee,
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
    swapFee?: SwapFeeInfo
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
    this.swapFee = swapFee
  }

  public get totalGasUseEstimateUSD(): number {
    if (this.wrapInfo.needsWrap && this.approveInfo.needsApprove) {
      return this.wrapInfo.wrapGasEstimateUSD + this.approveInfo.approveGasEstimateUSD
    }

    if (this.wrapInfo.needsWrap) return this.wrapInfo.wrapGasEstimateUSD
    if (this.approveInfo.needsApprove) return this.approveInfo.approveGasEstimateUSD

    return 0
  }
}

export class PreviewTrade {
  public readonly fillType = TradeFillType.None
  public readonly quoteMethod = QuoteMethod.QUICK_ROUTE
  public readonly tradeType: TradeType
  public readonly inputAmount: CurrencyAmount<Currency>
  public readonly outputAmount: CurrencyAmount<Currency>

  constructor({
    inputAmount,
    outputAmount,
    tradeType,
  }: {
    inputAmount: CurrencyAmount<Currency>
    outputAmount: CurrencyAmount<Currency>
    tradeType: TradeType
  }) {
    this.inputAmount = inputAmount
    this.outputAmount = outputAmount
    this.tradeType = tradeType
  }

  // below methods are copied from router-sdk
  // Trade https://github.com/Uniswap/router-sdk/blob/main/src/entities/trade.ts#L10
  public minimumAmountOut(slippageTolerance: Percent, amountOut = this.outputAmount): CurrencyAmount<Currency> {
    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return amountOut
    } else {
      const slippageAdjustedAmountOut = new Fraction(ONE)
        .add(slippageTolerance)
        .invert()
        .multiply(amountOut.quotient).quotient
      return CurrencyAmount.fromRawAmount(amountOut.currency, slippageAdjustedAmountOut)
    }
  }

  public maximumAmountIn(slippageTolerance: Percent, amountIn = this.inputAmount): CurrencyAmount<Currency> {
    if (this.tradeType === TradeType.EXACT_INPUT) {
      return amountIn
    } else {
      const slippageAdjustedAmountIn = new Fraction(ONE).add(slippageTolerance).multiply(amountIn.quotient).quotient
      return CurrencyAmount.fromRawAmount(amountIn.currency, slippageAdjustedAmountIn)
    }
  }

  /**
   * Returns the sell tax of the input token
   */
  public get inputTax(): Percent {
    const inputCurrency = this.inputAmount.currency
    if (inputCurrency.isNative || !inputCurrency.wrapped.sellFeeBps) return ZERO_PERCENT

    return new Percent(inputCurrency.wrapped.sellFeeBps.toNumber(), 10000)
  }

  /**
   * Returns the buy tax of the output token
   */
  public get outputTax(): Percent {
    const outputCurrency = this.outputAmount.currency
    if (outputCurrency.isNative || !outputCurrency.wrapped.buyFeeBps) return ZERO_PERCENT

    return new Percent(outputCurrency.wrapped.buyFeeBps.toNumber(), 10000)
  }

  private _executionPrice: Price<Currency, Currency> | undefined
  /**
   * The price expressed in terms of output amount/input amount.
   */
  public get executionPrice(): Price<Currency, Currency> {
    return (
      this._executionPrice ??
      (this._executionPrice = new Price(
        this.inputAmount.currency,
        this.outputAmount.currency,
        this.inputAmount.quotient,
        this.outputAmount.quotient
      ))
    )
  }

  public worstExecutionPrice(slippageTolerance: Percent): Price<Currency, Currency> {
    return new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.maximumAmountIn(slippageTolerance).quotient,
      this.minimumAmountOut(slippageTolerance).quotient
    )
  }
}

export type SubmittableTrade = ClassicTrade | DutchOrderTrade
export type InterfaceTrade = SubmittableTrade | PreviewTrade

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
      trade: SubmittableTrade
      latencyMs?: number
    }

export type PreviewTradeResult =
  | {
      state: QuoteState.NOT_FOUND
      trade?: undefined
      latencyMs?: number
    }
  | {
      state: QuoteState.SUCCESS
      trade: PreviewTrade
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
