import providers from '@ethersproject/providers'
import { ONE, Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Fraction, Percent, TradeType } from '@uniswap/sdk-core'
import { GasEstimate, TradingApi } from '@universe/api'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { ACROSS_DAPP_INFO, isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import {
  BaseSwapTransactionInfo,
  BridgeTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionType,
  TransactionTypeInfo,
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
}: {
  trade: Trade
  transactedUSDValue?: number
  gasEstimate?: GasEstimate
}): ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo | BridgeTransactionInfo {
  const { quote, slippageTolerance } = trade
  const { quoteId, gasUseEstimate, routeString } = getClassicQuoteFromResponse(quote) ?? {}

  // UniswapX trades wrap native input before swapping
  const inputCurrency = isUniswapX(trade) ? trade.inputAmount.currency.wrapped : trade.inputAmount.currency
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

export function getProtocolVersionFromTrade(trade: Trade): Protocol | undefined {
  if (!isClassic(trade)) {
    return undefined
  }

  if (trade.routes.every((r) => r.protocol === Protocol.V2)) {
    return Protocol.V2
  }
  if (trade.routes.every((r) => r.protocol === Protocol.V3)) {
    return Protocol.V3
  }
  return Protocol.MIXED
}

export function validateTransactionRequest(
  request?: providers.TransactionRequest | null,
): ValidatedTransactionRequest | undefined {
  if (request?.to && request.chainId) {
    return { ...request, to: request.to, chainId: request.chainId }
  }
  return undefined
}

export function validateTransactionRequests(
  requests?: providers.TransactionRequest[] | null,
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

export function validatePermit(permit: TradingApi.NullablePermit | undefined): ValidatedPermit | undefined {
  const { domain, types, values } = permit ?? {}
  if (domain && types && values) {
    return { domain, types, values }
  }
  return undefined
}

export function hasTradeType(
  typeInfo: TransactionTypeInfo,
): typeInfo is ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo {
  return 'tradeType' in typeInfo && typeInfo.tradeType !== undefined
}
