/* eslint-disable max-lines */
import { MixedRouteSDK, Trade as RouterSDKTrade, ZERO_PERCENT } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Price, TradeType } from '@uniswap/sdk-core'
import {
  PriorityOrderTrade as IPriorityOrderTrade,
  UnsignedPriorityOrderInfo,
  UnsignedV2DutchOrderInfo,
  UnsignedV3DutchOrderInfo,
  V2DutchOrderTrade,
  V3DutchOrderTrade,
} from '@uniswap/uniswapx-sdk'
import { Route as V2RouteSDK } from '@uniswap/v2-sdk'
import { Route as V3RouteSDK } from '@uniswap/v3-sdk'
import { Route as V4RouteSDK } from '@uniswap/v4-sdk'
import type {
  BridgeQuoteResponse,
  ChainedQuoteResponse,
  ClassicQuoteResponse,
  DutchQuoteResponse,
  DutchV3QuoteResponse,
  GasEstimate,
  PriorityQuoteResponse,
  UnwrapQuoteResponse,
  WrapQuoteResponse,
} from '@universe/api'
import { TradingApi } from '@universe/api'
import { BigNumber, providers } from 'ethers/lib/ethers'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { MAX_AUTO_SLIPPAGE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { BlockingTradeError } from 'uniswap/src/features/transactions/swap/types/BlockingTradeError'
import { getTradingApiSwapFee } from 'uniswap/src/features/transactions/swap/types/getTradingApiSwapFee'
import { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import { FrontendSupportedProtocol } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { CurrencyField } from 'uniswap/src/types/currency'

type QuoteResponseWithAggregatedOutputs =
  | ClassicQuoteResponse
  | DutchQuoteResponse
  | DutchV3QuoteResponse
  | PriorityQuoteResponse

/**
 * Calculates the total output amount from a quote by summing all aggregated outputs.
 *
 * @param quote - The quote response containing aggregated outputs, or undefined
 * @param outputCurrency - The currency type for the output amount
 * @returns CurrencyAmount representing the total output amount, or zero if no quote/outputs
 *
 * @example
 * const quote = { quote: { aggregatedOutputs: [{ amount: '100' }, { amount: '200' }] } }
 * const amount = getQuoteOutputAmount(quote, USDC) // Returns 300 USDC
 */
function getQuoteOutputAmount<T extends QuoteResponseWithAggregatedOutputs>(
  quote: T | undefined,
  outputCurrency: Currency,
): CurrencyAmount<Currency> {
  if (!quote) {
    return CurrencyAmount.fromRawAmount(outputCurrency, '0')
  }

  return (
    quote.quote.aggregatedOutputs?.reduce(
      (acc, output) => acc.add(CurrencyAmount.fromRawAmount(outputCurrency, output.amount ?? '0')),
      CurrencyAmount.fromRawAmount(outputCurrency, '0'),
    ) ?? CurrencyAmount.fromRawAmount(outputCurrency, '0')
  )
}

/**
 * Calculates the output amount that the recipient will receive from a quote.
 * Used to calculate the amount the recipient will receive after the swap fee is applied.
 *
 * @param quote - The quote response containing aggregated outputs, or undefined
 * @param outputCurrency - The currency type for the output amount
 * @param recipient - The address of the recipient to find the output for
 * @returns CurrencyAmount representing the minimum amount the recipient will receive, or zero if not found
 *
 * @example
 * // With a quote containing a recipient's output
 * const quote = { quote: { aggregatedOutputs: [{ recipient: '0x123', minAmount: '100' }, { recipient: '0x456', minAmount: '200' }] } }
 * const amount = getQuoteOutputAmountUserWillReceive(quote, USDC, '0x123') // Returns 100 USDC
 *
 */
function getQuoteOutputAmountUserWillReceive<T extends QuoteResponseWithAggregatedOutputs>({
  quote,
  outputCurrency,
  recipient,
}: {
  quote?: T
  outputCurrency: Currency
  recipient?: string
}): CurrencyAmount<Currency> {
  if (!quote || !recipient) {
    return CurrencyAmount.fromRawAmount(outputCurrency, '0')
  }

  const output = quote.quote.aggregatedOutputs?.find((out) => out.recipient === recipient)
  return output
    ? CurrencyAmount.fromRawAmount(outputCurrency, output.minAmount ?? '0')
    : CurrencyAmount.fromRawAmount(outputCurrency, '0')
}

export type UniswapXTrade = UniswapXV2Trade | UniswapXV3Trade | PriorityOrderTrade
export class UniswapXV2Trade extends V2DutchOrderTrade<Currency, Currency, TradeType> {
  readonly routing = TradingApi.Routing.DUTCH_V2
  readonly quote: DutchQuoteResponse
  readonly slippageTolerance: number
  readonly swapFee?: SwapFee
  readonly indicative = false

  readonly maxAmountIn: CurrencyAmount<Currency>
  readonly minAmountOut: CurrencyAmount<Currency>

  readonly blockingError?: BlockingTradeError

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
    this.swapFee = getTradingApiSwapFee(quote)

    // TODO(SWAP-235): Cleanup redundancy
    this.maxAmountIn = this.maximumAmountIn()
    this.minAmountOut = this.minimumAmountOut()
  }

  /** @deprecated see trade.maxAmountIn */
  public maximumAmountIn(): CurrencyAmount<Currency> {
    return super.maximumAmountIn()
  }

  /** @deprecated see trade.minAmountOut */
  public minimumAmountOut(): CurrencyAmount<Currency> {
    return super.minimumAmountOut()
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

  public get quoteOutputAmount(): CurrencyAmount<Currency> {
    return getQuoteOutputAmount(this.quote, this.outputAmount.currency)
  }

  public get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency> {
    return getQuoteOutputAmountUserWillReceive({
      quote: this.quote,
      outputCurrency: this.outputAmount.currency,
      recipient: this.quote.quote.orderInfo.swapper,
    })
  }
}

export class UniswapXV3Trade extends V3DutchOrderTrade<Currency, Currency, TradeType> {
  readonly routing = TradingApi.Routing.DUTCH_V3
  readonly quote: DutchV3QuoteResponse
  readonly slippageTolerance: number
  readonly swapFee?: SwapFee
  readonly indicative = false

  readonly maxAmountIn: CurrencyAmount<Currency>
  readonly minAmountOut: CurrencyAmount<Currency>

  readonly blockingError?: BlockingTradeError

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
    const { expectedAmountIn, expectedAmountOut } = quote.quote
    const expectedAmounts = expectedAmountIn && expectedAmountOut ? { expectedAmountIn, expectedAmountOut } : undefined

    super({ currencyIn, currenciesOut: [currencyOut], orderInfo, tradeType, expectedAmounts })

    this.quote = quote
    this.slippageTolerance = this.quote.quote.slippageTolerance ?? 0
    this.swapFee = getTradingApiSwapFee(quote)

    // TODO(SWAP-235): Cleanup redundancy
    this.maxAmountIn = this.maximumAmountIn()
    this.minAmountOut = this.minimumAmountOut()
  }

  /** @deprecated see trade.maxAmountIn */
  public maximumAmountIn(): CurrencyAmount<Currency> {
    return super.maximumAmountIn()
  }

  /** @deprecated see trade.minAmountOut */
  public minimumAmountOut(): CurrencyAmount<Currency> {
    return super.minimumAmountOut()
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

  public get quoteOutputAmount(): CurrencyAmount<Currency> {
    return getQuoteOutputAmount(this.quote, this.outputAmount.currency)
  }

  public get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency> {
    return getQuoteOutputAmountUserWillReceive({
      quote: this.quote,
      outputCurrency: this.outputAmount.currency,
      recipient: this.quote.quote.orderInfo.swapper,
    })
  }
}

export class PriorityOrderTrade extends IPriorityOrderTrade<Currency, Currency, TradeType> {
  readonly routing = TradingApi.Routing.PRIORITY
  readonly quote: PriorityQuoteResponse
  readonly slippageTolerance: number
  readonly swapFee?: SwapFee
  readonly indicative = false

  readonly maxAmountIn: CurrencyAmount<Currency>
  readonly minAmountOut: CurrencyAmount<Currency>

  readonly blockingError?: BlockingTradeError

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
    const { expectedAmountIn, expectedAmountOut } = quote.quote
    const expectedAmounts = expectedAmountIn && expectedAmountOut ? { expectedAmountIn, expectedAmountOut } : undefined

    super({ currencyIn, currenciesOut: [currencyOut], orderInfo, tradeType, expectedAmounts })

    this.quote = quote
    this.slippageTolerance = this.quote.quote.slippageTolerance ?? 0
    this.swapFee = getTradingApiSwapFee(quote)

    // TODO(SWAP-235): Cleanup redundancy
    this.maxAmountIn = this.maximumAmountIn()
    this.minAmountOut = this.minimumAmountOut()
  }

  /** @deprecated see trade.maxAmountIn */
  public maximumAmountIn(): CurrencyAmount<Currency> {
    return super.maximumAmountIn()
  }

  /** @deprecated see trade.minAmountOut */
  public minimumAmountOut(): CurrencyAmount<Currency> {
    return super.minimumAmountOut()
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

  public get quoteOutputAmount(): CurrencyAmount<Currency> {
    return getQuoteOutputAmount(this.quote, this.outputAmount.currency)
  }

  public get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency> {
    return getQuoteOutputAmountUserWillReceive({
      quote: this.quote,
      outputCurrency: this.outputAmount.currency,
      recipient: this.quote.quote.orderInfo.swapper,
    })
  }
}

// TODO: [MOB-238] use composition instead of inheritance
export class ClassicTrade<
  TInput extends Currency = Currency,
  TOutput extends Currency = Currency,
  TTradeType extends TradeType = TradeType,
> extends RouterSDKTrade<TInput, TOutput, TTradeType> {
  readonly quote: ClassicQuoteResponse
  readonly routing = TradingApi.Routing.CLASSIC
  readonly deadline: number
  readonly slippageTolerance: number
  readonly swapFee?: SwapFee
  readonly indicative = false

  readonly maxAmountIn: CurrencyAmount<Currency>
  readonly minAmountOut: CurrencyAmount<Currency>

  readonly blockingError?: BlockingTradeError

  constructor({
    quote,
    deadline,
    ...routes
  }: {
    readonly quote: ClassicQuoteResponse
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
    this.slippageTolerance = quote.quote.slippage ?? MAX_AUTO_SLIPPAGE_TOLERANCE
    this.swapFee = getTradingApiSwapFee(quote)

    const slippageTolerancePercent = slippageToleranceToPercent(this.slippageTolerance)
    // TODO(SWAP-235): Cleanup redundancy
    this.maxAmountIn = this.maximumAmountIn(slippageTolerancePercent)
    this.minAmountOut = this.minimumAmountOut(slippageTolerancePercent)
  }

  /** @deprecated see trade.maxAmountIn */
  public maximumAmountIn(slippageTolerance: Percent): CurrencyAmount<TInput> {
    return super.maximumAmountIn(slippageTolerance)
  }

  /** @deprecated see trade.minAmountOut */
  public minimumAmountOut(slippageTolerance: Percent): CurrencyAmount<TOutput> {
    return super.minimumAmountOut(slippageTolerance)
  }

  private _cachedPriceImpact?: Percent
  // Overrides trade sdk price impact with backend price impact when available, as sdk price impact formula can be inaccurate.
  public get priceImpact(): Percent {
    if (!this._cachedPriceImpact) {
      const quotePriceImpact = this.quote.quote.priceImpact
      this._cachedPriceImpact = quotePriceImpact
        ? new Percent(Math.round(quotePriceImpact * 100), 10000)
        : super.priceImpact
    }
    return this._cachedPriceImpact
  }

  public get quoteOutputAmount(): CurrencyAmount<Currency> {
    return getQuoteOutputAmount(this.quote, this.outputAmount.currency)
  }

  public get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency> {
    return getQuoteOutputAmountUserWillReceive({
      quote: this.quote,
      outputCurrency: this.outputAmount.currency,
      recipient: this.quote.quote.swapper,
    })
  }
}

export type Trade<
  TInput extends Currency = Currency,
  TOutput extends Currency = Currency,
  TTradeType extends TradeType = TradeType,
> =
  | ClassicTrade<TInput, TOutput, TTradeType>
  | UniswapXTrade
  | BridgeTrade
  | WrapTrade
  | UnwrapTrade
  | SolanaTrade
  | ChainedActionTrade

export type TradeWithSlippage = Exclude<Trade, BridgeTrade>

// TODO(WALL-4573) - Cleanup usage of optionality/null/undefined
export interface TradeWithStatus<T extends Trade = Trade> {
  isLoading: boolean
  isFetching?: boolean
  error: Error | null
  trade: T | null
  indicativeTrade: IndicativeTrade | undefined
  isIndicativeLoading: boolean
  gasEstimate: GasEstimate | undefined
}

export interface UseTradeArgs {
  account?: AccountDetails
  amountSpecified: Maybe<CurrencyAmount<Currency>>
  otherCurrency: Maybe<Currency>
  tradeType: TradeType
  pollInterval?: PollingInterval
  customSlippageTolerance?: number
  isUSDQuote?: boolean
  sendPortionEnabled?: boolean
  // TODO(SWAP-154): Remove skip
  skip?: boolean
  selectedProtocols?: FrontendSupportedProtocol[]
  isDebouncing?: boolean
  generatePermitAsTransaction?: boolean
  isV4HookPoolsEnabled?: boolean
}

export type SwapFee = {
  recipient?: string
  percent: Percent
  amount: string
  /** Indicates if the fee is taken from the input or output token. */
  feeField: CurrencyField
}

export type SwapFeeInfo = {
  noFeeCharged: boolean
  formattedPercent: string
  formattedAmount: string
  formattedAmountFiat?: string
}

export enum ApprovalAction {
  // either native token or allowance is sufficient, no approval or permit needed
  None = 'none',

  // erc20 approval is needed for the permit2 contract
  Permit2Approve = 'permit2-approve',

  // revoke required before token can be approved
  RevokeAndPermit2Approve = 'revoke-and-permit2-approve',

  // Unable to fetch approval status, should block submission UI
  Unknown = 'unknown',
}

export type TokenApprovalInfo =
  | {
      action: ApprovalAction.None | ApprovalAction.Unknown
      txRequest: null
      cancelTxRequest: null
    }
  | {
      action: ApprovalAction.Permit2Approve
      txRequest: providers.TransactionRequest
      cancelTxRequest: null
    }
  | {
      action: ApprovalAction.RevokeAndPermit2Approve
      txRequest: providers.TransactionRequest
      cancelTxRequest: providers.TransactionRequest
    }

// Converts from BE type to SDK type
function transformToV2DutchOrderInfo(orderInfo: TradingApi.DutchOrderInfoV2): UnsignedV2DutchOrderInfo {
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
      token: output.token,
      startAmount: BigNumber.from(output.startAmount),
      endAmount: BigNumber.from(output.endAmount),
      recipient: output.recipient,
    })),
    cosigner: orderInfo.cosigner ?? '',
  }
}

function transformToV3DutchOrderInfo(orderInfo: TradingApi.DutchOrderInfoV3): UnsignedV3DutchOrderInfo {
  return {
    ...orderInfo,
    startingBaseFee: BigNumber.from(0),
    nonce: BigNumber.from(orderInfo.nonce),
    additionalValidationContract: orderInfo.additionalValidationContract ?? '',
    additionalValidationData: orderInfo.additionalValidationData ?? '',
    input: {
      token: orderInfo.input.token,
      startAmount: BigNumber.from(orderInfo.input.startAmount),
      curve: {
        relativeBlocks: orderInfo.input.curve.relativeBlocks ?? [],
        relativeAmounts: orderInfo.input.curve.relativeAmounts?.map((amount) => BigInt(amount)) ?? [],
      },
      maxAmount: BigNumber.from(orderInfo.input.maxAmount),
      adjustmentPerGweiBaseFee: BigNumber.from(orderInfo.input.adjustmentPerGweiBaseFee),
    },
    outputs: orderInfo.outputs.map((output) => ({
      token: output.token,
      startAmount: BigNumber.from(output.startAmount),
      curve: {
        relativeBlocks: output.curve.relativeBlocks ?? [],
        relativeAmounts: output.curve.relativeAmounts?.map((amount) => BigInt(amount)) ?? [],
      },
      minAmount: BigNumber.from(output.minAmount),
      adjustmentPerGweiBaseFee: BigNumber.from(output.adjustmentPerGweiBaseFee),
      recipient: output.recipient,
    })),
    cosigner: orderInfo.cosigner ?? '',
  }
}

function transformToPriorityOrderInfo(orderInfo: TradingApi.PriorityOrderInfo): UnsignedPriorityOrderInfo {
  return {
    ...orderInfo,
    nonce: BigNumber.from(orderInfo.nonce),
    additionalValidationContract: orderInfo.additionalValidationContract ?? '',
    additionalValidationData: orderInfo.additionalValidationData ?? '',
    input: {
      token: orderInfo.input.token,
      amount: BigNumber.from(orderInfo.input.amount),
      mpsPerPriorityFeeWei: BigNumber.from(orderInfo.input.mpsPerPriorityFeeWei),
    },
    outputs: orderInfo.outputs.map((output) => ({
      token: output.token,
      amount: BigNumber.from(output.amount),
      mpsPerPriorityFeeWei: BigNumber.from(output.mpsPerPriorityFeeWei),
      recipient: output.recipient,
    })),
    baselinePriorityFeeWei: BigNumber.from(orderInfo.baselinePriorityFeeWei),
    auctionStartBlock: BigNumber.from(orderInfo.auctionStartBlock),
  }
}

export type ValidatedIndicativeQuoteResponse = TradingApi.QuoteResponse & {
  input: Required<TradingApi.ClassicInput>
  output: Required<TradingApi.ClassicOutput>
}

export function validateIndicativeQuoteResponse(
  response: TradingApi.QuoteResponse,
): ValidatedIndicativeQuoteResponse | undefined {
  if ('input' in response.quote && 'output' in response.quote) {
    const input = response.quote.input
    const output = response.quote.output
    if (!input || !output) {
      return undefined
    }
    if (input.amount && input.token && output.amount && output.token && output.recipient) {
      return {
        ...response,
        input: { amount: input.amount, token: input.token },
        output: { amount: output.amount, token: output.token, recipient: output.recipient },
      }
    }
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

  constructor({
    quote,
    currencyIn,
    currencyOut,
    slippageTolerance,
  }: {
    quote: ValidatedIndicativeQuoteResponse
    currencyIn: Currency
    currencyOut: Currency
    slippageTolerance?: number
  }) {
    this.quote = quote

    const inputAmount = getCurrencyAmount({
      value: this.quote.input.amount,
      valueType: ValueType.Raw,
      currency: currencyIn,
    })
    const outputAmount = getCurrencyAmount({
      value: this.quote.output.amount,
      valueType: ValueType.Raw,
      currency: currencyOut,
    })

    if (!inputAmount || !outputAmount) {
      throw new Error('Error parsing indicative quote currency amounts')
    }
    this.inputAmount = inputAmount
    this.outputAmount = outputAmount
    this.executionPrice = new Price(currencyIn, currencyOut, this.quote.input.amount, this.quote.output.amount)
    this.slippageTolerance = slippageTolerance
  }

  public get quoteOutputAmount(): CurrencyAmount<Currency> {
    return this.outputAmount
  }

  public get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency> {
    return this.outputAmount
  }
}

export class BridgeTrade {
  readonly quote: BridgeQuoteResponse
  readonly inputAmount: CurrencyAmount<Currency>
  readonly outputAmount: CurrencyAmount<Currency>
  readonly maxAmountIn: CurrencyAmount<Currency>
  readonly minAmountOut: CurrencyAmount<Currency>
  readonly executionPrice: Price<Currency, Currency>

  readonly tradeType: TradeType
  readonly routing = TradingApi.Routing.BRIDGE
  readonly indicative = false
  readonly swapFee?: SwapFee
  readonly inputTax: Percent = ZERO_PERCENT
  readonly outputTax: Percent = ZERO_PERCENT

  readonly slippageTolerance: undefined
  readonly priceImpact: undefined
  readonly deadline: undefined

  readonly blockingError?: BlockingTradeError

  constructor({
    quote,
    currencyIn,
    currencyOut,
    tradeType,
  }: { quote: BridgeQuoteResponse; currencyIn: Currency; currencyOut: Currency; tradeType: TradeType }) {
    this.quote = quote
    this.swapFee = getTradingApiSwapFee(quote)

    const quoteInputAmount = quote.quote.input?.amount
    const quoteOutputAmount = quote.quote.output?.amount
    if (!quoteInputAmount || !quoteOutputAmount) {
      throw new Error('Error parsing bridge quote currency amounts')
    }

    const inputAmount = getCurrencyAmount({ value: quoteInputAmount, valueType: ValueType.Raw, currency: currencyIn })
    const outputAmount = getCurrencyAmount({
      value: quoteOutputAmount,
      valueType: ValueType.Raw,
      currency: currencyOut,
    })
    if (!inputAmount || !outputAmount) {
      throw new Error('Error parsing bridge quote currency amounts')
    }

    this.inputAmount = inputAmount
    this.outputAmount = outputAmount
    this.executionPrice = new Price(currencyIn, currencyOut, quoteInputAmount, quoteOutputAmount)
    this.tradeType = tradeType

    /* Bridge trades have no slippage and hence static input/output amounts. `maxAmountIn` `and minAmountOut` are implemented for compatibility with other trade types. */
    this.maxAmountIn = this.inputAmount
    this.minAmountOut = this.outputAmount
  }

  public get quoteOutputAmount(): CurrencyAmount<Currency> {
    return this.outputAmount
  }

  public get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency> {
    const swapFeeAmount = this.swapFee
      ? getCurrencyAmount({
          value: this.swapFee.amount,
          valueType: ValueType.Raw,
          currency: this.outputAmount.currency,
        })
      : undefined

    if (swapFeeAmount) {
      return this.outputAmount.add(swapFeeAmount)
    }

    return this.outputAmount
  }
}

abstract class BaseWrapTrade<
  TWrapType extends TradingApi.Routing.WRAP | TradingApi.Routing.UNWRAP,
  TQuoteResponse extends TWrapType extends TradingApi.Routing.WRAP ? WrapQuoteResponse : UnwrapQuoteResponse,
> {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  maxAmountIn: CurrencyAmount<Currency>
  minAmountOut: CurrencyAmount<Currency>
  executionPrice: Price<Currency, Currency>
  quote: TQuoteResponse
  tradeType: TradeType
  abstract routing: TWrapType
  readonly indicative = false
  readonly swapFee?: SwapFee
  readonly inputTax: Percent = ZERO_PERCENT
  readonly outputTax: Percent = ZERO_PERCENT
  readonly slippageTolerance = 0
  readonly priceImpact: undefined
  readonly deadline: undefined

  readonly blockingError?: BlockingTradeError

  constructor({
    quote,
    currencyIn,
    currencyOut,
    tradeType,
  }: {
    quote: TQuoteResponse
    currencyIn: Currency
    currencyOut: Currency
    tradeType: TradeType
  }) {
    this.quote = quote
    const quoteInputAmount = quote.quote.input?.amount
    const quoteOutputAmount = quote.quote.output?.amount
    if (!quoteInputAmount || !quoteOutputAmount) {
      throw new Error('Error parsing wrap/unwrap quote currency amounts')
    }
    const inputAmount = getCurrencyAmount({ value: quoteInputAmount, valueType: ValueType.Raw, currency: currencyIn })
    const outputAmount = getCurrencyAmount({
      value: quoteOutputAmount,
      valueType: ValueType.Raw,
      currency: currencyOut,
    })
    if (!inputAmount || !outputAmount) {
      throw new Error('Error parsing wrap/unwrap quote currency amounts')
    }
    this.inputAmount = inputAmount
    this.outputAmount = outputAmount
    this.executionPrice = new Price(currencyIn, currencyOut, 1, 1)
    this.tradeType = tradeType
    // Wrap/unwrap trades have no slippage and hence static input/output amounts.
    this.maxAmountIn = this.inputAmount
    this.minAmountOut = this.outputAmount
  }

  public get quoteOutputAmount(): CurrencyAmount<Currency> {
    return this.outputAmount
  }
  public get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency> {
    return this.outputAmount
  }
}

export class WrapTrade extends BaseWrapTrade<TradingApi.Routing.WRAP, WrapQuoteResponse> {
  readonly routing = TradingApi.Routing.WRAP

  constructor({
    quote,
    currencyIn,
    currencyOut,
    tradeType,
  }: {
    quote: WrapQuoteResponse
    currencyIn: Currency
    currencyOut: Currency
    tradeType: TradeType
  }) {
    super({ quote, currencyIn, currencyOut, tradeType })
  }
}

export class UnwrapTrade extends BaseWrapTrade<TradingApi.Routing.UNWRAP, UnwrapQuoteResponse> {
  readonly routing = TradingApi.Routing.UNWRAP

  constructor({
    quote,
    currencyIn,
    currencyOut,
    tradeType,
  }: {
    quote: UnwrapQuoteResponse
    currencyIn: Currency
    currencyOut: Currency
    tradeType: TradeType
  }) {
    super({ quote, currencyIn, currencyOut, tradeType })
  }
}

// TODO: SWAP-458 - Subject to change.
export class ChainedActionTrade {
  readonly routing = TradingApi.Routing.CHAINED
  quote: ChainedQuoteResponse
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  executionPrice: Price<Currency, Currency>
  swapFee: undefined
  readonly inputTax: Percent = ZERO_PERCENT
  readonly outputTax: Percent = ZERO_PERCENT
  slippageTolerance: number
  readonly indicative = false
  readonly tradeType: TradeType = TradeType.EXACT_INPUT
  readonly deadline: undefined

  // depends on trade type. since exact input, max amount in is the input amount
  readonly maxAmountIn: CurrencyAmount<Currency>

  // worst case scenario is the output amount
  readonly minAmountOut: CurrencyAmount<Currency>

  readonly blockingError?: BlockingTradeError

  constructor({
    quote,
    currencyIn,
    currencyOut,
  }: { quote: ChainedQuoteResponse; currencyIn: Currency; currencyOut: Currency; slippageTolerance?: number }) {
    this.quote = quote

    const inputAmount = getCurrencyAmount({
      value: this.quote.quote.input?.amount,
      valueType: ValueType.Raw,
      currency: currencyIn,
    })
    const outputAmount = getCurrencyAmount({
      value: this.quote.quote.output?.amount,
      valueType: ValueType.Raw,
      currency: currencyOut,
    })

    if (!inputAmount || !outputAmount) {
      throw new Error('Error parsing indicative quote currency amounts')
    }
    this.inputAmount = inputAmount
    this.outputAmount = outputAmount
    this.executionPrice = new Price(currencyIn, currencyOut, inputAmount.quotient, outputAmount.quotient)

    this.slippageTolerance = this.quote.quote.slippage ?? 0
    this.maxAmountIn = inputAmount
    this.minAmountOut = outputAmount
  }

  public get quoteOutputAmount(): CurrencyAmount<Currency> {
    return this.outputAmount
  }

  public get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency> {
    return this.outputAmount
  }

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
