import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query'
import { MixedRouteSDK, Trade as RouterSDKTrade, ZERO_PERCENT } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { V2DutchOrderTrade } from '@uniswap/uniswapx-sdk'
import { Route as V2RouteSDK } from '@uniswap/v2-sdk'
import { Route as V3RouteSDK } from '@uniswap/v3-sdk'
import { providers } from 'ethers'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { TradeProtocolPreference } from 'uniswap/src/features/transactions/transactionState/types'
import { ClassicQuote, DutchQuoteV2, QuoteResponse, Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { getSwapFee, transformToDutchOrderInfo } from 'wallet/src/features/transactions/swap/trade/api/utils'

// TradingAPI team is looking into updating type generation to produce the following types for it's current QuoteResponse type:
// See: https://linear.app/uniswap/issue/API-236/explore-changing-the-quote-schema-to-pull-out-a-basequoteresponse
export type DiscriminatedQuoteResponse = ClassicQuoteResponse | DutchQuoteResponse

export type DutchQuoteResponse = QuoteResponse & {
  quote: DutchQuoteV2
  routing: Routing.DUTCH_V2
}

export type ClassicQuoteResponse = QuoteResponse & {
  quote: ClassicQuote
  routing: Routing.CLASSIC
}

export class UniswapXTrade extends V2DutchOrderTrade<Currency, Currency, TradeType> {
  readonly routing = Routing.DUTCH_V2
  readonly quote: DutchQuoteResponse
  readonly slippageTolerance: number
  readonly swapFee?: SwapFee

  constructor({
    quote,
    currencyIn,
    currencyOut,
    tradeType,
  }: {
    quote: DutchQuoteResponse
    currencyIn: Currency
    currencyOut: Currency
    tradeType: TradeType
  }) {
    const orderInfo = transformToDutchOrderInfo(quote.quote.orderInfo)
    super({ currencyIn, currenciesOut: [currencyOut], orderInfo, tradeType })
    this.quote = quote
    this.slippageTolerance = this.quote.quote.slippageTolerance ?? 0
    this.swapFee = getSwapFee(quote)
  }

  public get needsWrap(): boolean {
    return this.inputAmount.currency.isNative
  }

  public get deadline(): number {
    return this.order.info.deadline
  }

  public get priceImpact(): Percent {
    return ZERO_PERCENT
  }

  public get inputTax(): Percent {
    return ZERO_PERCENT
  }

  public get outputTax(): Percent {
    return ZERO_PERCENT
  }
}

// TODO: [MOB-238] use composition instead of inheritance
export class ClassicTrade<
  TInput extends Currency = Currency,
  TOutput extends Currency = Currency,
  TTradeType extends TradeType = TradeType,
> extends RouterSDKTrade<TInput, TOutput, TTradeType> {
  readonly quote?: ClassicQuoteResponse
  readonly routing = Routing.CLASSIC
  readonly deadline: number
  readonly slippageTolerance: number
  readonly swapFee?: SwapFee

  constructor({
    quote,
    deadline,
    slippageTolerance,
    ...routes
  }: {
    readonly quote?: ClassicQuoteResponse
    readonly deadline: number
    readonly slippageTolerance: number
    readonly v2Routes: {
      routev2: V2RouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    readonly v3Routes: {
      routev3: V3RouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    readonly mixedRoutes: {
      mixedRoute: MixedRouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    readonly tradeType: TTradeType
  }) {
    super(routes)
    this.quote = quote
    this.deadline = deadline
    this.slippageTolerance = slippageTolerance
    this.swapFee = getSwapFee(quote)
  }
}

export type Trade<
  TInput extends Currency = Currency,
  TOutput extends Currency = Currency,
  TTradeType extends TradeType = TradeType,
> = ClassicTrade<TInput, TOutput, TTradeType> | UniswapXTrade

export interface TradeWithStatus<T extends Trade = Trade> {
  loading: boolean
  error?: FetchBaseQueryError | SerializedError
  trade: null | T
  isFetching?: boolean
}

export interface UseTradeArgs {
  amountSpecified: Maybe<CurrencyAmount<Currency>>
  otherCurrency: Maybe<Currency>
  tradeType: TradeType
  pollInterval?: PollingInterval
  customSlippageTolerance?: number
  isUSDQuote?: boolean
  sendPortionEnabled?: boolean
  skip?: boolean
  tradeProtocolPreference?: TradeProtocolPreference
}

export type SwapFee = { recipient?: string; percent: Percent; amount: string }

export type SwapFeeInfo = {
  noFeeCharged: boolean
  formattedPercent: string
  formattedAmount: string
  formattedAmountFiat?: string
}

export enum ApprovalAction {
  // either native token or allowance is sufficient, no approval or permit needed
  None = 'none',

  // not enough allowance and token cannot be approved through .permit instead
  Approve = 'approve',

  // not enough allowance but token can be approved through permit signature
  Permit = 'permit',

  Permit2Approve = 'permit2-approve',

  // Unable to fetch approval status, should block submission UI
  Unknown = 'unknown',
}

export type TokenApprovalInfo =
  | {
      action: ApprovalAction.None | ApprovalAction.Permit | ApprovalAction.Unknown
      txRequest: null
    }
  | {
      action: ApprovalAction.Approve | ApprovalAction.Permit2Approve
      txRequest: providers.TransactionRequest
    }
