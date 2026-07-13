import { type TransactionRequest } from '@ethersproject/providers'
import { NFTPermitData, PermitBatchData } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { ONE, Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Fraction, Percent, TradeType } from '@uniswap/sdk-core'
import { GasEstimate, TradingApi } from '@universe/api'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import type { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { ACROSS_DAPP_INFO, isBridge, isClassic, isWrap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import {
  BaseSwapTransactionInfo,
  BridgeTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  RwaSwapAnalytics,
  TransactionType,
  TransactionTypeInfo,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  PopulatedTransactionRequestArray,
  ValidatedTransactionRequest,
} from 'uniswap/src/features/transactions/types/transactionRequests'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

export function tradeToTransactionInfo({
  trade,
  transactedUSDValue,
  gasEstimate,
  swapStartTimestamp,
  isFinalStep,
  rwaAnalytics,
}: {
  trade: Trade
  transactedUSDValue?: number
  gasEstimate?: GasEstimate
  swapStartTimestamp?: number
  isFinalStep?: boolean
  /** RWA analytics computed at submit, persisted so the finalization-time Completed event can report them. */
  rwaAnalytics?: RwaSwapAnalytics
}): ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo | BridgeTransactionInfo | WrapTransactionInfo {
  const { quote, slippageTolerance } = trade
  const { quoteId, gasUseEstimate, routeString } = getClassicQuoteFromResponse(quote) ?? {}
  // Whether gas was sponsored, derived from the quote's offer and persisted so the finalization-time
  // Completed/Failed event can report it. Deriving here (rather than threading from callers) ensures every
  // typeInfo builder — including the 4337 userOp swap path — captures it. See getSponsorshipAnalyticsProperties.
  const isSponsored = 'sponsorshipInfo' in quote ? quote.sponsorshipInfo?.sponsored : undefined
  const sponsorshipCampaignId = 'sponsorshipInfo' in quote ? quote.sponsorshipInfo?.campaign?.name : undefined

  const inputCurrency = trade.inputAmount.currency
  const outputCurrency = trade.outputAmount.currency

  if (isBridge(trade)) {
    return {
      type: TransactionType.Bridge,
      inputCurrencyId: currencyId(inputCurrency),
      inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
      outputCurrencyId: currencyId(outputCurrency),
      outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
      routingDappInfo: ACROSS_DAPP_INFO,
      quoteId,
      gasUseEstimate,
      transactedUSDValue,
      gasEstimate,
      swapStartTimestamp,
      isFinalStep,
      isSponsored,
      sponsorshipCampaignId,
      ...rwaAnalytics,
    }
  }

  if (isWrap(trade)) {
    return {
      type: TransactionType.Wrap,
      unwrapped: trade.routing === TradingApi.Routing.UNWRAP,
      currencyAmountRaw: trade.inputAmount.quotient.toString(),
      gasEstimate,
    }
  }

  const baseTransactionInfo: BaseSwapTransactionInfo = {
    type: TransactionType.Swap,
    inputCurrencyId: currencyId(inputCurrency),
    outputCurrencyId: currencyId(outputCurrency),
    slippageTolerance,
    quoteId,
    gasUseEstimate,
    routeString,
    protocol: getProtocolVersionFromTrade(trade),
    simulationFailureReasons: isClassic(trade) ? trade.quote.quote.txFailureReasons : undefined,
    transactedUSDValue,
    gasEstimate,
    swapStartTimestamp,
    isFinalStep,
    isSponsored,
    sponsorshipCampaignId,
    ...rwaAnalytics,
  }

  return trade.tradeType === TradeType.EXACT_INPUT
    ? {
        ...baseTransactionInfo,
        tradeType: TradeType.EXACT_INPUT,
        inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
        expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
        minimumOutputCurrencyAmountRaw: trade.minAmountOut.quotient.toString(),
      }
    : {
        ...baseTransactionInfo,
        tradeType: TradeType.EXACT_OUTPUT,
        outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
        expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
        maximumInputCurrencyAmountRaw: trade.maxAmountIn.quotient.toString(),
      }
}

/** Returns true if the new trade price is outside the threshold for trade prices to be considered auto-acceptable or not.*/
function isNewTradePriceOutsideThreshold(oldTrade: Trade, newTrade: Trade): boolean {
  const multiplier = new Fraction(ONE).subtract(ACCEPT_NEW_TRADE_THRESHOLD)
  const thresholdAmount = multiplier.multiply(oldTrade.executionPrice)

  return newTrade.executionPrice.lessThan(thresholdAmount)
}

// any price movement below ACCEPT_NEW_TRADE_THRESHOLD is auto-accepted for the user
const ACCEPT_NEW_TRADE_THRESHOLD = new Percent(1, 100)

/** Returns true if `newTrade` differs from `oldTrade` enough to require explicit user acceptance. */
export function requireAcceptNewTrade(oldTrade: Maybe<Trade>, newTrade: Maybe<Trade>): boolean {
  if (!oldTrade || !newTrade) {
    return false
  }

  if (isNewTradePriceOutsideThreshold(oldTrade, newTrade)) {
    return true
  }

  return (
    oldTrade.tradeType !== newTrade.tradeType ||
    !oldTrade.inputAmount.currency.equals(newTrade.inputAmount.currency) ||
    !oldTrade.outputAmount.currency.equals(newTrade.outputAmount.currency)
  )
}

/**
 * Calculate Rate Line: The rate is line is calculate by using the output token's USD price
 * Caculate input rate amount:
 *  ( output USD amount / input coin ratio ) * the output coin ratio
 *
 * Caculate output rate line:
 * ( input rate amount / input coin ratio )
 *
 * Example:
 * Swap: 1.50 ETH = 367.351 UNI
 * ETH USD Price: $4,839.93, UNI USD Price: $4,755.47
 * Corrected Rate Calculation:
 * 1 UNI USD Rate = 4,755.47 / 367.351 = 12.94 USD
 * 1 ETH USD Rate = (4,755.47 / 367.351) * 244.9 = 3,170 USD
 */
export function calculateRateLine({
  usdAmountOut,
  outputCurrencyAmount,
  trade,
  showInverseRate,
  formatter,
}: {
  usdAmountOut: CurrencyAmount<Currency> | null
  outputCurrencyAmount: Maybe<CurrencyAmount<Currency>>
  trade: Trade | IndicativeTrade | undefined | null
  showInverseRate: boolean
  formatter: LocalizationContextState
}): string {
  const isValidAmounts = usdAmountOut && outputCurrencyAmount

  const outputRateAmount = isValidAmounts
    ? parseFloat(usdAmountOut.toSignificant()) / parseFloat(outputCurrencyAmount.toSignificant())
    : null

  const inputRateAmount =
    outputRateAmount && trade ? outputRateAmount * parseFloat(trade.executionPrice.toSignificant()) : null

  const rateToDisplay = showInverseRate ? outputRateAmount : inputRateAmount

  const latestFiatPriceFormatted = formatter.convertFiatAmountFormatted(rateToDisplay, NumberType.FiatTokenPrice)

  return latestFiatPriceFormatted
}

export function getRateToDisplay({
  formatter,
  trade,
  showInverseRate,
}: {
  formatter: LocalizationContextState
  trade: Trade | IndicativeTrade
  showInverseRate: boolean
}): string {
  const price = showInverseRate ? trade.executionPrice.invert() : trade.executionPrice

  let formattedPrice: string
  try {
    formattedPrice = formatter.formatNumberOrString({
      value: price.toSignificant(),
      type: NumberType.SwapPrice,
    })
  } catch (_error) {
    // This means the price impact is so high that the rate is basically 0 (an error is thrown because we try to divide by 0)
    formattedPrice = '0'
  }

  const quoteCurrencySymbol = getSymbolDisplayText(trade.executionPrice.quoteCurrency.symbol)
  const baseCurrencySymbol = getSymbolDisplayText(trade.executionPrice.baseCurrency.symbol)
  const rate = `1 ${quoteCurrencySymbol} = ${formattedPrice} ${baseCurrencySymbol}`
  const inverseRate = `1 ${baseCurrencySymbol} = ${formattedPrice} ${quoteCurrencySymbol}`
  return showInverseRate ? rate : inverseRate
}

/**
 * Derives the protocol version-set from a quote's `swapSteps` and maps it to a single `Protocol`.
 * A single version maps to its matching protocol; multiple versions are reported as MIXED. Returns
 * undefined when no swap versions are present (e.g. pure wrap/unwrap steps), letting the caller fall
 * back to route-based inference.
 *
 * Reads `swapSteps` directly rather than reusing `summarizeSwapSteps` (which also computes pool
 * counts and lives alongside the UI/routing-diagram layer) to keep this data util free of that
 * dependency — importing it introduces a circular dependency through `swap/utils/routing`.
 */
function getProtocolFromSwapSteps(steps: readonly TradingApi.SwapStep[]): Protocol | undefined {
  const versions = new Set<Protocol.V2 | Protocol.V3 | Protocol.V4>()

  for (const step of steps) {
    switch (step.type) {
      case 'V2_SWAP_EXACT_IN':
      case 'V2_SWAP_EXACT_OUT':
        versions.add(Protocol.V2)
        break
      case 'V3_SWAP_EXACT_IN':
      case 'V3_SWAP_EXACT_OUT':
        versions.add(Protocol.V3)
        break
      case 'V4_SWAP':
        for (const action of step.v4Actions) {
          switch (action.action) {
            case 'SWAP_EXACT_IN':
            case 'SWAP_EXACT_OUT':
            case 'SWAP_EXACT_IN_SINGLE':
            case 'SWAP_EXACT_OUT_SINGLE':
              versions.add(Protocol.V4)
              break
            // SETTLE / TAKE action variants contribute no protocol version.
          }
        }
        break
      // WRAP_ETH / UNWRAP_WETH steps contribute no protocol version.
    }
  }

  if (versions.size === 0) {
    return undefined
  }
  if (versions.size > 1) {
    return Protocol.MIXED
  }
  const [version] = versions
  return version
}

export function getProtocolVersionFromTrade(trade: Trade): Protocol | undefined {
  if (!isClassic(trade)) {
    return undefined
  }

  // Prefer the new `swapSteps` routing field when present: it is the canonical Universal Router
  // step sequence and correctly distinguishes V4 (which the route-based fallback below cannot).
  // Only populated when the GuideStar quoter wins the hybrid quote race.
  const { swapSteps } = trade.quote.quote
  if (swapSteps?.length) {
    const protocol = getProtocolFromSwapSteps(swapSteps)
    if (protocol) {
      return protocol
    }
  }

  // Fallback for quotes without `swapSteps`: infer from the classic quote route hop types.
  // Note: route hops cannot express V4, so V4 is only detectable via `swapSteps` above.
  const route = trade.quote.quote.route ?? []
  const protocols = new Set(route.flatMap((hops) => hops.map((hop) => hop.type)))
  if (protocols.size === 0) {
    return undefined
  }
  if (protocols.size === 1 && protocols.has('v2-pool')) {
    return Protocol.V2
  }
  if (protocols.size === 1 && protocols.has('v3-pool')) {
    return Protocol.V3
  }
  return Protocol.MIXED
}

export function validateTransactionRequest(
  request?: TransactionRequest | null,
): ValidatedTransactionRequest | undefined {
  if (request?.to && request.chainId) {
    return { ...request, to: request.to, chainId: request.chainId }
  }
  return undefined
}

export function validateTransactionRequests(
  requests?: TransactionRequest[] | null,
): PopulatedTransactionRequestArray | undefined {
  if (!requests?.length) {
    return undefined
  }

  const validatedRequests: ValidatedTransactionRequest[] = []
  for (const request of requests) {
    const validatedRequest = validateTransactionRequest(request)
    if (!validatedRequest) {
      return undefined
    }
    validatedRequests.push(validatedRequest)
  }

  // Satisfy type checker by ensuring array is non-empty
  const [firstRequest, ...restRequests] = validatedRequests
  return firstRequest ? [firstRequest, ...restRequests] : undefined
}

type RemoveUndefined<T> = {
  [P in keyof T]-?: Exclude<T[P], undefined>
}

export type ValidatedPermit = RemoveUndefined<TradingApi.Permit>

export function validatePermit(
  permit: TradingApi.NullablePermit | PermitBatchData | NFTPermitData | undefined,
): ValidatedPermit | undefined {
  const { domain, types, values } = permit ?? {}
  if (domain && types && values) {
    return { domain, types, values }
  }
  return undefined
}

export function validatePermitTypeGuard(permit: TradingApi.NullablePermit | undefined): permit is ValidatedPermit {
  return !!permit && !!permit.domain && !!permit.types && !!permit.values
}

export function hasTradeType(
  typeInfo: TransactionTypeInfo,
): typeInfo is ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo {
  return 'tradeType' in typeInfo && typeInfo.tradeType !== undefined
}
