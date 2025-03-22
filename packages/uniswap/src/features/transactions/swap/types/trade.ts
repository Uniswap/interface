import { MixedRouteSDK, Trade as RouterSDKTrade, ZERO_PERCENT } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Price, TradeType } from '@uniswap/sdk-core'
import { UnsignedV2DutchOrderInfo, V2DutchOrderTrade, PriorityOrderTrade as IPriorityOrderTrade, UnsignedPriorityOrderInfo, V3DutchOrderTrade, UnsignedV3DutchOrderInfo } from '@uniswap/uniswapx-sdk'
import { Route as V2RouteSDK } from '@uniswap/v2-sdk'
import { Route as V3RouteSDK } from '@uniswap/v3-sdk'
import { Route as V4RouteSDK } from '@uniswap/v4-sdk'
import { AxiosError } from 'axios'
import { BridgeQuoteResponse, ClassicQuoteResponse, DutchQuoteResponse, DutchV3QuoteResponse, PriorityQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { BigNumber, providers } from 'ethers/lib/ethers'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  DutchOrderInfoV2,
  DutchOrderInfoV3,
  IndicativeQuoteResponse,
  PriorityOrderInfo,
  Routing,
} from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { FrontendSupportedProtocol } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { MAX_AUTO_SLIPPAGE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { getSwapFee } from 'uniswap/src/features/transactions/swap/types/getSwapFee'

export type UniswapXTrade = UniswapXV2Trade | UniswapXV3Trade | PriorityOrderTrade
export class UniswapXV2Trade extends V2DutchOrderTrade<Currency, Currency, TradeType> {
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
    const orderInfo = transformToV2DutchOrderInfo(quote.quote.orderInfo)
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

  public get inputTax(): Percent {
    return ZERO_PERCENT
  }

  public get outputTax(): Percent {
    return ZERO_PERCENT
  }
}

export class UniswapXV3Trade extends V3DutchOrderTrade<Currency, Currency, TradeType> {
  readonly routing = Routing.DUTCH_V3
  readonly quote: DutchV3QuoteResponse
  readonly slippageTolerance: number
  readonly swapFee?: SwapFee
  readonly indicative = false

  constructor({
    quote,
    currencyIn,
    currencyOut,
    tradeType,
  }: {
    quote: DutchV3QuoteResponse
    currencyIn: Currency
    currencyOut: Currency
    tradeType: TradeType
  }) {
    const orderInfo = transformToV3DutchOrderInfo(quote.quote.orderInfo)
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

  public get inputTax(): Percent {
    return ZERO_PERCENT
  }

  public get outputTax(): Percent {
    return ZERO_PERCENT
  }
}

export class PriorityOrderTrade extends IPriorityOrderTrade<Currency, Currency, TradeType> {
  readonly routing = Routing.PRIORITY
  readonly quote: PriorityQuoteResponse
  readonly slippageTolerance: number
  readonly swapFee?: SwapFee
  readonly indicative = false

  constructor({
    quote,
    currencyIn,
    currencyOut,
    tradeType,
  }: {
    quote: PriorityQuoteResponse
    currencyIn: Currency
    currencyOut: Currency
    tradeType: TradeType
  }) {
    const orderInfo = transformToPriorityOrderInfo(quote.quote.orderInfo)
    const { expectedAmountIn, expectedAmountOut} = quote.quote
    const expectedAmounts = expectedAmountIn && expectedAmountOut ? { expectedAmountIn, expectedAmountOut  } : undefined

    super({ currencyIn, currenciesOut: [currencyOut], orderInfo, tradeType, expectedAmounts })

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
    ...routes
  }: {
    readonly quote?: ClassicQuoteResponse
    readonly deadline: number
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
    readonly v4Routes: {
      routev4: V4RouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    readonly tradeType: TTradeType
  }) {
    super(routes)
    this.quote = quote
    this.deadline = deadline
    this.slippageTolerance = quote?.quote.slippage ?? MAX_AUTO_SLIPPAGE_TOLERANCE
    this.swapFee = getSwapFee(quote)
  }

  
  private _cachedPriceImpact?: Percent
  // Overrides trade sdk price impact with backend price impact when available, as sdk price impact formula can be inaccurate.
  public get priceImpact(): Percent {
    if (!this._cachedPriceImpact) {
      const quotePriceImpact = this.quote?.quote.priceImpact
      this._cachedPriceImpact = quotePriceImpact ? new Percent(Math.round(quotePriceImpact * 100), 10000) : super.priceImpact
    }
    return this._cachedPriceImpact
  }
}

export type Trade<
  TInput extends Currency = Currency,
  TOutput extends Currency = Currency,
  TTradeType extends TradeType = TradeType,
> = ClassicTrade<TInput, TOutput, TTradeType> | UniswapXTrade | BridgeTrade

export type TradeWithSlippage = Exclude<Trade, BridgeTrade>

// TODO(WALL-4573) - Cleanup usage of optionality/null/undefined
export interface TradeWithStatus<T extends Trade = Trade> {
  isLoading: boolean
  isFetching?: boolean
  error: Error | AxiosError | null
  trade: T | null
  indicativeTrade: IndicativeTrade | undefined
  isIndicativeLoading: boolean
  gasEstimates: GasFeeEstimates | undefined
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
  selectedProtocols?: FrontendSupportedProtocol[]
  isDebouncing?: boolean
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

  // revoke required before token can be approved
  RevokeAndPermit2Approve = 'revoke-and-permit2-approve',

  // Unable to fetch approval status, should block submission UI
  Unknown = 'unknown',
}

export type TokenApprovalInfo =
  | {
      action: ApprovalAction.None | ApprovalAction.Permit | ApprovalAction.Unknown
      txRequest: null
      cancelTxRequest: null
    }
  | {
      action: ApprovalAction.Approve | ApprovalAction.Permit2Approve
      txRequest: providers.TransactionRequest
      cancelTxRequest: null
    } | {
      action: ApprovalAction.RevokeAndPermit2Approve
      txRequest: providers.TransactionRequest
      cancelTxRequest: providers.TransactionRequest
    }

// Converts from BE type to SDK type
function transformToV2DutchOrderInfo(orderInfo: DutchOrderInfoV2): UnsignedV2DutchOrderInfo {
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

function transformToV3DutchOrderInfo(orderInfo: DutchOrderInfoV3): UnsignedV3DutchOrderInfo {
  return {
    ...orderInfo,
    startingBaseFee: BigNumber.from(0),
    nonce: BigNumber.from(orderInfo.nonce),
    additionalValidationContract: orderInfo.additionalValidationContract ?? '',
    additionalValidationData: orderInfo.additionalValidationData ?? '',
    input: {
      token: orderInfo.input.token ?? '',
      startAmount: BigNumber.from(orderInfo.input.startAmount),
      curve: {
        relativeBlocks: orderInfo.input.curve?.relativeBlocks ?? [],
        relativeAmounts: orderInfo.input.curve?.relativeAmounts?.map((amount) => BigInt(amount)) ?? [],
      },
      maxAmount: BigNumber.from(orderInfo.input.maxAmount),
      adjustmentPerGweiBaseFee: BigNumber.from(orderInfo.input.adjustmentPerGweiBaseFee),
    },
    outputs: orderInfo.outputs.map((output) => ({
      token: output.token ?? '',
      startAmount: BigNumber.from(output.startAmount),
      curve: {
        relativeBlocks: orderInfo.input.curve?.relativeBlocks ?? [],
        relativeAmounts: orderInfo.input.curve?.relativeAmounts?.map((amount) => BigInt(amount)) ?? [],
      },
      minAmount: BigNumber.from(output.minAmount),
      adjustmentPerGweiBaseFee: BigNumber.from(output.adjustmentPerGweiBaseFee),
      recipient: output.recipient,
    })),
    cosigner: orderInfo.cosigner ?? '',
  }
}

function transformToPriorityOrderInfo(orderInfo: PriorityOrderInfo): UnsignedPriorityOrderInfo {
  return {
    ...orderInfo,
    nonce: BigNumber.from(orderInfo.nonce),
    additionalValidationContract: orderInfo.additionalValidationContract ?? '',
    additionalValidationData: orderInfo.additionalValidationData ?? '',
    input: {
      token: orderInfo.input.token ?? '',
      amount: BigNumber.from(orderInfo.input.amount),
      mpsPerPriorityFeeWei:  BigNumber.from(orderInfo.input.mpsPerPriorityFeeWei),
    },
    outputs: orderInfo.outputs.map((output) => ({
      token: output.token ?? '',
      amount: BigNumber.from(output.amount),
      mpsPerPriorityFeeWei:  BigNumber.from(output.mpsPerPriorityFeeWei),
      recipient: output.recipient,
    })),
    baselinePriorityFeeWei: BigNumber.from(orderInfo.baselinePriorityFeeWei),
    auctionStartBlock: BigNumber.from(orderInfo.auctionStartBlock),
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

export class BridgeTrade {
  quote: BridgeQuoteResponse
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  executionPrice: Price<Currency, Currency>

  tradeType: TradeType
  readonly routing = Routing.BRIDGE
  readonly indicative = false
  readonly swapFee?: SwapFee
  readonly inputTax: Percent = ZERO_PERCENT
  readonly outputTax: Percent = ZERO_PERCENT

  readonly slippageTolerance: undefined
  readonly priceImpact: undefined
  readonly deadline: undefined

  constructor({ quote, currencyIn, currencyOut, tradeType }: { quote: BridgeQuoteResponse, currencyIn: Currency, currencyOut: Currency, tradeType: TradeType }) {
    this.quote = quote
    this.swapFee = getSwapFee(quote)

    const quoteInputAmount = quote.quote.input?.amount
    const quoteOutputAmount = quote.quote.output?.amount
    if (!quoteInputAmount || !quoteOutputAmount) {
      throw new Error('Error parsing bridge quote currency amounts')
    }

    const inputAmount = getCurrencyAmount({ value: quoteInputAmount, valueType: ValueType.Raw, currency: currencyIn })
    const outputAmount = getCurrencyAmount({ value: quoteOutputAmount, valueType: ValueType.Raw, currency: currencyOut })
    if (!inputAmount || !outputAmount) {
      throw new Error('Error parsing bridge quote currency amounts')
    }

    this.inputAmount = inputAmount
    this.outputAmount = outputAmount
    this.executionPrice = new Price(currencyIn, currencyOut, quoteInputAmount, quoteOutputAmount)
    this.tradeType = tradeType
  }

  /* Bridge trades have no slippage and hence a static execution price.
  The following methods are overridden for compatibility with other trade types */
  worstExecutionPrice(_threshold: Percent): Price<Currency, Currency> {
    return this.executionPrice
  }

  maximumAmountIn(_slippageTolerance: Percent, _amountIn?: CurrencyAmount<Currency>): CurrencyAmount<Currency> {
    return this.inputAmount
  }

  minimumAmountOut(_slippageTolerance: Percent, _amountOut?: CurrencyAmount<Currency>): CurrencyAmount<Currency> {
    return this.outputAmount
  }
}
