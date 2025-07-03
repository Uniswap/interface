import { Currency, CurrencyAmount, TradeType as SdkTradeType } from '@uniswap/sdk-core'
import { TradeType as TradingApiTradeType } from 'uniswap/src/data/tradingApi/__generated__/index'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'

interface DetermineSwapCurrenciesAndStaticArgsInput {
  tradeType: SdkTradeType
  amountSpecified?: CurrencyAmount<Currency> | null
  otherCurrency?: Currency | null
}

export interface DetermineSwapCurrenciesAndStaticArgsOutput {
  currencyIn?: Currency
  currencyOut?: Currency
  requestTradeType: TradingApiTradeType
  exactCurrencyField: CurrencyField
}

export function determineSwapCurrenciesAndStaticArgs(
  input: DetermineSwapCurrenciesAndStaticArgsInput,
): DetermineSwapCurrenciesAndStaticArgsOutput {
  const { tradeType, amountSpecified, otherCurrency } = input

  const currencyIn = tradeType === SdkTradeType.EXACT_INPUT ? amountSpecified?.currency : otherCurrency
  const currencyOut = tradeType === SdkTradeType.EXACT_OUTPUT ? amountSpecified?.currency : otherCurrency

  const requestTradeType =
    tradeType === SdkTradeType.EXACT_INPUT ? TradingApiTradeType.EXACT_INPUT : TradingApiTradeType.EXACT_OUTPUT

  const exactCurrencyField = tradeType === SdkTradeType.EXACT_INPUT ? CurrencyField.INPUT : CurrencyField.OUTPUT

  return {
    currencyIn: currencyIn ?? undefined,
    currencyOut: currencyOut ?? undefined,
    requestTradeType,
    exactCurrencyField,
  }
}

export function isZeroAmount(amountSpecified?: CurrencyAmount<Currency> | null): boolean {
  return amountSpecified?.quotient.toString() === '0'
}

export function areCurrenciesEqual(currencyIn?: Currency | null, currencyOut?: Currency | null): boolean {
  return !!currencyIn && !!currencyOut && areCurrencyIdsEqual(currencyId(currencyIn), currencyId(currencyOut))
}
