import { Currency, CurrencyAmount, TradeType as SdkTradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'

interface ParseQuoteCurrenciesInput {
  tradeType: SdkTradeType
  amountSpecified?: CurrencyAmount<Currency> | null
  otherCurrency?: Currency | null
}

export interface QuoteCurrencyData {
  currencyIn?: Currency
  currencyOut?: Currency
  requestTradeType: TradingApi.TradeType
}

export function parseQuoteCurrencies(input: ParseQuoteCurrenciesInput): QuoteCurrencyData {
  const { tradeType, amountSpecified, otherCurrency } = input

  const currencyIn = tradeType === SdkTradeType.EXACT_INPUT ? amountSpecified?.currency : otherCurrency
  const currencyOut = tradeType === SdkTradeType.EXACT_OUTPUT ? amountSpecified?.currency : otherCurrency

  const requestTradeType =
    tradeType === SdkTradeType.EXACT_INPUT ? TradingApi.TradeType.EXACT_INPUT : TradingApi.TradeType.EXACT_OUTPUT

  return {
    currencyIn: currencyIn ?? undefined,
    currencyOut: currencyOut ?? undefined,
    requestTradeType,
  }
}

export function isZeroAmount(amountSpecified?: CurrencyAmount<Currency> | null): boolean {
  return amountSpecified?.quotient.toString() === '0'
}

export function areCurrenciesEqual(currencyIn?: Currency | null, currencyOut?: Currency | null): boolean {
  return !!currencyIn && !!currencyOut && areCurrencyIdsEqual(currencyId(currencyIn), currencyId(currencyOut))
}
