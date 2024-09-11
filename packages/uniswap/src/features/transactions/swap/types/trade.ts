import { MixedRouteSDK, Trade as RouterSDKTrade, ZERO_PERCENT } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Price, TradeType } from '@uniswap/sdk-core'
import { UnsignedV2DutchOrderInfo, V2DutchOrderTrade } from '@uniswap/uniswapx-sdk'
import { Route as V2RouteSDK } from '@uniswap/v2-sdk'
import { Route as V3RouteSDK } from '@uniswap/v3-sdk'
import { AxiosError } from 'axios'
import { ClassicQuoteResponse, DiscriminatedQuoteResponse, DutchQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { BigNumber, providers } from 'ethers/lib/ethers'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  DutchOrderInfoV2,
  IndicativeQuoteResponse,
  Routing,
} from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { TradeProtocolPreference } from 'uniswap/src/features/transactions/types/transactionState'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'

export class UniswapXTrade extends V2DutchOrderTrade<Currency, Currency, TradeType> {
  readonly routing = Routing.DUTCH_V2
  readonly quote: DutchQuoteResponse
  readonly slippageTolerance: number
  readonly swapFee?: SwapFee
  readonly indicative = false

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
  readonly indicative = false

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

// TODO(WALL-4573) - Cleanup usage of optionality/null/undefined 
export interface TradeWithStatus<T extends Trade = Trade> {
  isLoading: boolean
  isFetching?: boolean
  error: Error | AxiosError | null
  trade: T | null
  indicativeTrade: IndicativeTrade | undefined
  isIndicativeLoading: boolean
}

export interface UseTradeArgs {
  account?: AccountMeta
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

// Converts from BE type to SDK type
function transformToDutchOrderInfo(orderInfo: DutchOrderInfoV2): UnsignedV2DutchOrderInfo {
  return {
    ...orderInfo,
    nonce: BigNumber.from(orderInfo.nonce),
    additionalValidationContract: orderInfo.additionalValidationContract ?? '',
    additionalValidationData: orderInfo.additionalValidationData ?? '',
    input: {
      token: orderInfo.input.token ?? '',
      startAmount: BigNumber.from(orderInfo.input.startAmount),
      endAmount: BigNumber.from(orderInfo.input.endAmount),
    },
    outputs: orderInfo.outputs.map((output) => ({
      token: output.token ?? '',
      startAmount: BigNumber.from(output.startAmount),
      endAmount: BigNumber.from(output.endAmount),
      recipient: output.recipient,
    })),
    cosigner: orderInfo.cosigner ?? '',
  }
}

function getSwapFee(quoteResponse?: DiscriminatedQuoteResponse): SwapFee | undefined {
  if (!quoteResponse?.quote.portionAmount || !quoteResponse?.quote?.portionBips) {
    return undefined
  }
  return {
    recipient: quoteResponse.quote.portionRecipient,
    percent: new Percent(quoteResponse.quote.portionBips, '10000'),
    amount: quoteResponse?.quote.portionAmount,
  }
}

type ValidatedIndicativeQuoteToken = Required<IndicativeQuoteResponse["input"]>

export type ValidatedIndicativeQuoteResponse = IndicativeQuoteResponse & {
  input: ValidatedIndicativeQuoteToken
  output: ValidatedIndicativeQuoteToken
}

export function validateIndicativeQuoteResponse(response: IndicativeQuoteResponse): ValidatedIndicativeQuoteResponse | undefined {
  const { input, output } = response
  if (response.input && response.output && response.requestId && response.type && input.amount && input.chainId && input.token && output.amount && output.chainId && output.token) {
    return { ...response, input:  { amount: input.amount, chainId: input.chainId, token: output.token }, output:  { amount: output.amount, chainId: output.chainId, token: output.token } }
  }
  return undefined
}

export class IndicativeTrade {
  quote: ValidatedIndicativeQuoteResponse
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  executionPrice: Price<Currency, Currency>
  swapFee: undefined
  inputTax: undefined
  outputTax: undefined
  slippageTolerance?: number
  readonly indicative = true

  constructor({ quote, currencyIn, currencyOut, slippageTolerance }: { quote: ValidatedIndicativeQuoteResponse, currencyIn: Currency, currencyOut: Currency, slippageTolerance?: number }) {
    this.quote = quote
    
    const inputAmount = getCurrencyAmount({ value: this.quote.input.amount, valueType: ValueType.Raw, currency: currencyIn })
    const outputAmount = getCurrencyAmount({ value: this.quote.output.amount, valueType: ValueType.Raw, currency: currencyOut })

    if (!inputAmount || !outputAmount) {
      throw new Error('Error parsing indicative quote currency amounts')
    }
    this.inputAmount = inputAmount
    this.outputAmount = outputAmount
    this.executionPrice = new Price(currencyIn, currencyOut, this.quote.input.amount, this.quote.output.amount)
    this.slippageTolerance = slippageTolerance
  }
}
