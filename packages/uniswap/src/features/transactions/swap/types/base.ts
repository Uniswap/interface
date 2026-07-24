import type { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Price } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import type { BlockingTradeError } from 'uniswap/src/features/transactions/swap/types/BlockingTradeError'
import type { SwapFee } from 'uniswap/src/features/transactions/swap/types/trade'

export type BaseTrade<TQuote, TRouting extends TradingApi.Routing> = {
  readonly quote: TQuote
  readonly routing: TRouting
  readonly tradeType: TradeType
  readonly inputAmount: CurrencyAmount<Currency>
  readonly outputAmount: CurrencyAmount<Currency>
  readonly maxAmountIn: CurrencyAmount<Currency>
  readonly minAmountOut: CurrencyAmount<Currency>
  readonly executionPrice: Price<Currency, Currency>
  readonly quoteOutputAmount: CurrencyAmount<Currency>
  readonly quoteOutputAmountUserWillReceive: CurrencyAmount<Currency>
  readonly indicative: boolean
  readonly swapFee?: SwapFee
  readonly inputTax?: Percent
  readonly outputTax?: Percent
  readonly slippageTolerance?: number
  readonly priceImpact?: Percent
  readonly deadline?: number
  readonly blockingError?: BlockingTradeError
}

type QuoteInputOutput = {
  quote: {
    input?: TradingApi.QuoteInput
    output?: TradingApi.QuoteOutput
  }
}

export type BaseTradeAmounts = {
  readonly inputAmount: CurrencyAmount<Currency>
  readonly outputAmount: CurrencyAmount<Currency>
  readonly maxAmountIn: CurrencyAmount<Currency>
  readonly minAmountOut: CurrencyAmount<Currency>
  readonly executionPrice: Price<Currency, Currency>
}

export function createCurrencyAmount(
  currency: Currency,
  rawAmount: string | undefined,
): CurrencyAmount<Currency> | null {
  return (
    getCurrencyAmount({
      value: rawAmount,
      valueType: ValueType.Raw,
      currency,
    }) ?? null
  )
}

export function createBaseTradeAmounts({
  quote,
  currencyIn,
  currencyOut,
}: {
  quote: QuoteInputOutput
  currencyIn: Currency
  currencyOut: Currency
}): BaseTradeAmounts | null {
  const inputAmount = createCurrencyAmount(currencyIn, quote.quote.input?.amount)
  const outputAmount = createCurrencyAmount(currencyOut, quote.quote.output?.amount)

  if (!inputAmount || !outputAmount) {
    return null
  }

  const maxAmountIn = createCurrencyAmount(currencyIn, quote.quote.input?.maximumAmount) ?? inputAmount
  const minAmountOut = createCurrencyAmount(currencyOut, quote.quote.output?.minimumAmount) ?? outputAmount

  return {
    inputAmount,
    outputAmount,
    maxAmountIn,
    minAmountOut,
    executionPrice: new Price(currencyIn, currencyOut, inputAmount.quotient, outputAmount.quotient),
  }
}
