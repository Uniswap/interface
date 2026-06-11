import type { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Price } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import {
  type BaseTrade,
  type BaseTradeAmounts,
  createCurrencyAmount,
} from 'uniswap/src/features/transactions/swap/types/base'
import type { ValidatedIndicativeQuoteResponse } from 'uniswap/src/features/transactions/swap/types/trade'

export type IndicativeTrade = BaseTrade<ValidatedIndicativeQuoteResponse, TradingApi.Routing> & {
  readonly indicative: true
  readonly swapFee: undefined
  readonly inputTax: undefined
  readonly outputTax: undefined
  readonly slippageTolerance?: number
  readonly priceImpact?: Percent
  readonly deadline: undefined
}

export function createIndicativeTrade({
  quote,
  currencyIn,
  currencyOut,
  slippageTolerance,
  tradeType,
}: {
  quote: ValidatedIndicativeQuoteResponse
  currencyIn: Currency
  currencyOut: Currency
  slippageTolerance?: number
  tradeType: TradeType
}): IndicativeTrade | null {
  const amounts = createIndicativeTradeAmounts({ quote, currencyIn, currencyOut })

  if (!amounts) {
    return null
  }

  return {
    ...amounts,
    quote,
    routing: quote.routing,
    tradeType,
    quoteOutputAmount: amounts.outputAmount,
    quoteOutputAmountUserWillReceive: amounts.outputAmount,
    indicative: true,
    swapFee: undefined,
    inputTax: undefined,
    outputTax: undefined,
    slippageTolerance,
    deadline: undefined,
  }
}

function createIndicativeTradeAmounts({
  quote,
  currencyIn,
  currencyOut,
}: {
  quote: ValidatedIndicativeQuoteResponse
  currencyIn: Currency
  currencyOut: Currency
}): BaseTradeAmounts | null {
  const inputAmount = createCurrencyAmount(currencyIn, quote.input.amount)
  const outputAmount = createCurrencyAmount(currencyOut, quote.output.amount)

  if (!inputAmount || !outputAmount) {
    return null
  }

  // Indicative quotes have no slippage and `ValidatedIndicativeQuoteResponse` only guarantees `input`/`output.amount`,
  // so fall back to the exact input/output amounts — matching the legacy IndicativeTrade behavior.
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
