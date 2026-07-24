import { ZERO_PERCENT } from '@uniswap/router-sdk'
import type { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import type { DutchQuoteResponse, DutchV3QuoteResponse, PriorityQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import { type BaseTrade, createBaseTradeAmounts } from 'uniswap/src/features/transactions/swap/types/base'
import {
  getQuoteOutputAmount,
  getQuoteOutputAmountUserWillReceive,
} from 'uniswap/src/features/transactions/swap/types/getQuoteOutputAmount'
import { getTradingApiSwapFee } from 'uniswap/src/features/transactions/swap/types/getTradingApiSwapFee'

type UniswapXBaseTrade<TQuote, TRouting extends TradingApi.Routing> = BaseTrade<TQuote, TRouting> & {
  readonly indicative: false
  readonly deadline: number
  readonly slippageTolerance: number
  readonly inputTax: Percent
  readonly outputTax: Percent
}

export type UniswapXV2Trade = UniswapXBaseTrade<DutchQuoteResponse, TradingApi.Routing.DUTCH_V2>
export type UniswapXV3Trade = UniswapXBaseTrade<DutchV3QuoteResponse, TradingApi.Routing.DUTCH_V3>
export type PriorityOrderTrade = UniswapXBaseTrade<PriorityQuoteResponse, TradingApi.Routing.PRIORITY>
export type UniswapXTrade = UniswapXV2Trade | UniswapXV3Trade | PriorityOrderTrade

export function createUniswapXV2Trade({
  quote,
  currencyIn,
  currencyOut,
  tradeType,
}: {
  quote: DutchQuoteResponse
  currencyIn: Currency
  currencyOut: Currency
  tradeType: TradeType
}): UniswapXV2Trade | null {
  return createUniswapXTrade({ quote, currencyIn, currencyOut, tradeType, routing: TradingApi.Routing.DUTCH_V2 })
}

export function createUniswapXV3Trade({
  quote,
  currencyIn,
  currencyOut,
  tradeType,
}: {
  quote: DutchV3QuoteResponse
  currencyIn: Currency
  currencyOut: Currency
  tradeType: TradeType
}): UniswapXV3Trade | null {
  return createUniswapXTrade({ quote, currencyIn, currencyOut, tradeType, routing: TradingApi.Routing.DUTCH_V3 })
}

export function createPriorityOrderTrade({
  quote,
  currencyIn,
  currencyOut,
  tradeType,
}: {
  quote: PriorityQuoteResponse
  currencyIn: Currency
  currencyOut: Currency
  tradeType: TradeType
}): PriorityOrderTrade | null {
  return createUniswapXTrade({ quote, currencyIn, currencyOut, tradeType, routing: TradingApi.Routing.PRIORITY })
}

function createUniswapXTrade<TQuote extends DutchQuoteResponse | DutchV3QuoteResponse | PriorityQuoteResponse>({
  quote,
  currencyIn,
  currencyOut,
  tradeType,
  routing,
}: {
  quote: TQuote
  currencyIn: Currency
  currencyOut: Currency
  tradeType: TradeType
  routing: TQuote['routing']
}): UniswapXBaseTrade<TQuote, TQuote['routing']> | null {
  const amounts = createBaseTradeAmounts({ quote, currencyIn, currencyOut })

  if (!amounts) {
    return null
  }

  const outputCurrency = amounts.outputAmount.currency

  return {
    ...amounts,
    quote,
    routing,
    tradeType,
    deadline: quote.quote.orderInfo.deadline,
    slippageTolerance: quote.quote.slippageTolerance ?? 0,
    swapFee: getTradingApiSwapFee(quote),
    inputTax: ZERO_PERCENT,
    outputTax: ZERO_PERCENT,
    quoteOutputAmount: getQuoteOutputAmount(quote, outputCurrency),
    quoteOutputAmountUserWillReceive: getQuoteOutputAmountUserWillReceive({
      quote,
      outputCurrency,
      recipient: quote.quote.orderInfo.swapper,
    }),
    indicative: false,
  }
}
