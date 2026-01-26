import { Currency, CurrencyAmount, TradeType as SdkTradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'

interface ParseQuoteCurrenciesInput {
  tradeType: SdkTradeType
  amountSpecified?: CurrencyAmount<Currency> | null
  otherCurrency?: Currency | null
  // Explicit sell and buy tokens from UI to ensure consistency
  sellToken?: Currency
  buyToken?: Currency
}

export interface QuoteCurrencyData {
  currencyIn?: Currency
  currencyOut?: Currency
  requestTradeType: TradingApi.TradeType
}

export function parseQuoteCurrencies(input: ParseQuoteCurrenciesInput): QuoteCurrencyData {
  const { tradeType, amountSpecified, otherCurrency, sellToken, buyToken } = input

  // CRITICAL: If explicit sellToken and buyToken are provided, use them directly
  // This ensures tokenIn/tokenOut always match UI's sell/buy tokens
  // If either is missing, we should NOT use fallback logic as it may use stale/incorrect values
  if (sellToken && buyToken) {
    const requestTradeType =
      tradeType === SdkTradeType.EXACT_INPUT ? TradingApi.TradeType.EXACT_INPUT : TradingApi.TradeType.EXACT_OUTPUT

    return {
      currencyIn: sellToken,
      currencyOut: buyToken,
      requestTradeType,
    }
  }

  // If sellToken or buyToken is missing, return undefined to prevent incorrect quote requests
  // This ensures we only send requests when we have explicit UI state, not inferred state
  // The skip flag in useDerivedSwapInfo should prevent this from being called, but this is a safety check
  const requestTradeType =
    tradeType === SdkTradeType.EXACT_INPUT ? TradingApi.TradeType.EXACT_INPUT : TradingApi.TradeType.EXACT_OUTPUT

  return {
    currencyIn: undefined,
    currencyOut: undefined,
    requestTradeType,
  }
}

export function isZeroAmount(amountSpecified?: CurrencyAmount<Currency> | null): boolean {
  return amountSpecified?.quotient.toString() === '0'
}

export function areCurrenciesEqual(currencyIn?: Currency | null, currencyOut?: Currency | null): boolean {
  return !!currencyIn && !!currencyOut && areCurrencyIdsEqual(currencyId(currencyIn), currencyId(currencyOut))
}
