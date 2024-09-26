import providers from '@ethersproject/providers'
import { Protocol } from '@uniswap/router-sdk'
import { Percent, TradeType } from '@uniswap/sdk-core'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import {
  BaseSwapTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  GasFeeEstimates,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

export function tradeToTransactionInfo(
  trade: Trade,
  transactedUSDValue?: number,
  gasEstimates?: GasFeeEstimates,
): ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo {
  const slippageTolerancePercent = slippageToleranceToPercent(trade.slippageTolerance ?? 0)
  const { quote, slippageTolerance } = trade
  const { quoteId, gasUseEstimate, routeString } = getClassicQuoteFromResponse(quote) ?? {}

  // UniswapX trades wrap native input before swapping
  const inputCurrency = isUniswapX(trade) ? trade.inputAmount.currency.wrapped : trade.inputAmount.currency
  const outputCurrency = trade.outputAmount.currency

  const baseTransactionInfo: BaseSwapTransactionInfo = {
    type: TransactionType.Swap,
    inputCurrencyId: currencyId(inputCurrency),
    outputCurrencyId: currencyId(outputCurrency),
    slippageTolerance,
    quoteId,
    gasUseEstimate,
    routeString,
    protocol: getProtocolVersionFromTrade(trade),
    transactedUSDValue,
    gasEstimates,
  }

  return trade.tradeType === TradeType.EXACT_INPUT
    ? {
        ...baseTransactionInfo,
        tradeType: TradeType.EXACT_INPUT,
        inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
        expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
        minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(slippageTolerancePercent).quotient.toString(),
      }
    : {
        ...baseTransactionInfo,
        tradeType: TradeType.EXACT_OUTPUT,
        outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
        expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
        maximumInputCurrencyAmountRaw: trade.maximumAmountIn(slippageTolerancePercent).quotient.toString(),
      }
}

// any price movement below ACCEPT_NEW_TRADE_THRESHOLD is auto-accepted for the user
const ACCEPT_NEW_TRADE_THRESHOLD = new Percent(1, 100)
export function requireAcceptNewTrade(oldTrade: Maybe<Trade>, newTrade: Maybe<Trade>): boolean {
  if (!oldTrade || !newTrade) {
    return false
  }

  return (
    oldTrade.tradeType !== newTrade.tradeType ||
    !oldTrade.inputAmount.currency.equals(newTrade.inputAmount.currency) ||
    !oldTrade.outputAmount.currency.equals(newTrade.outputAmount.currency) ||
    newTrade.executionPrice.lessThan(oldTrade.worstExecutionPrice(ACCEPT_NEW_TRADE_THRESHOLD))
  )
}

export const getRateToDisplay = (
  formatter: LocalizationContextState,
  trade: Trade | IndicativeTrade,
  showInverseRate: boolean,
): string => {
  const price = showInverseRate ? trade.executionPrice.invert() : trade.executionPrice

  let formattedPrice: string
  try {
    formattedPrice = formatter.formatNumberOrString({
      value: price.toSignificant(),
      type: NumberType.SwapPrice,
    })
  } catch (error) {
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

export type ValidatedTransactionRequest = providers.TransactionRequest & { to: string; chainId: number }
export function validateTransactionRequest(
  request?: providers.TransactionRequest | null,
): ValidatedTransactionRequest | undefined {
  if (request?.to && request.chainId) {
    return { ...request, to: request.to, chainId: request.chainId }
  }
  return undefined
}
