import { ZERO_PERCENT } from '@uniswap/router-sdk'
import type { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import type { UnwrapQuoteResponse, WrapQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import { type BaseTrade, createBaseTradeAmounts } from 'uniswap/src/features/transactions/swap/types/base'

type BaseWrapTrade<TQuote, TRouting extends TradingApi.Routing.WRAP | TradingApi.Routing.UNWRAP> = BaseTrade<
  TQuote,
  TRouting
> & {
  readonly indicative: false
  readonly swapFee: undefined
  readonly inputTax: Percent
  readonly outputTax: Percent
  readonly slippageTolerance: 0
  readonly priceImpact: undefined
  readonly deadline: undefined
}

export type WrapTrade = BaseWrapTrade<WrapQuoteResponse, TradingApi.Routing.WRAP>
export type UnwrapTrade = BaseWrapTrade<UnwrapQuoteResponse, TradingApi.Routing.UNWRAP>

export function createWrapTrade({
  quote,
  currencyIn,
  currencyOut,
  tradeType,
}: {
  quote: WrapQuoteResponse
  currencyIn: Currency
  currencyOut: Currency
  tradeType: TradeType
}): WrapTrade | null {
  return createBaseWrapTrade({ quote, currencyIn, currencyOut, tradeType, routing: TradingApi.Routing.WRAP })
}

export function createUnwrapTrade({
  quote,
  currencyIn,
  currencyOut,
  tradeType,
}: {
  quote: UnwrapQuoteResponse
  currencyIn: Currency
  currencyOut: Currency
  tradeType: TradeType
}): UnwrapTrade | null {
  return createBaseWrapTrade({ quote, currencyIn, currencyOut, tradeType, routing: TradingApi.Routing.UNWRAP })
}

function createBaseWrapTrade<TQuote extends WrapQuoteResponse | UnwrapQuoteResponse>({
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
}): BaseWrapTrade<TQuote, TQuote['routing']> | null {
  const amounts = createBaseTradeAmounts({ quote, currencyIn, currencyOut })

  if (!amounts) {
    return null
  }

  return {
    ...amounts,
    quote,
    routing,
    tradeType,
    swapFee: undefined,
    inputTax: ZERO_PERCENT,
    outputTax: ZERO_PERCENT,
    slippageTolerance: 0,
    priceImpact: undefined,
    deadline: undefined,
    quoteOutputAmount: amounts.outputAmount,
    quoteOutputAmountUserWillReceive: amounts.outputAmount,
    indicative: false,
  }
}
