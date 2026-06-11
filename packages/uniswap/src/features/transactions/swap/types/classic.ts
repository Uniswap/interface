import { ZERO_PERCENT } from '@uniswap/router-sdk'
import type { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Percent as PercentValue } from '@uniswap/sdk-core'
import type { ClassicQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import { MAX_AUTO_SLIPPAGE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { type BaseTrade, createBaseTradeAmounts } from 'uniswap/src/features/transactions/swap/types/base'
import { getTradingApiSwapFee } from 'uniswap/src/features/transactions/swap/types/getTradingApiSwapFee'
import {
  getQuoteOutputAmount,
  getQuoteOutputAmountUserWillReceive,
} from 'uniswap/src/features/transactions/swap/types/trade'

export type ClassicTrade = BaseTrade<ClassicQuoteResponse, TradingApi.Routing.CLASSIC> & {
  readonly indicative: false
  readonly deadline: number
  readonly slippageTolerance: number
  readonly inputTax: Percent
  readonly outputTax: Percent
}

export function createClassicTrade({
  quote,
  currencyIn,
  currencyOut,
  tradeType,
  deadline,
}: {
  quote: ClassicQuoteResponse
  currencyIn: Currency
  currencyOut: Currency
  tradeType: TradeType
  deadline: number
}): ClassicTrade | null {
  const amounts = createBaseTradeAmounts({ quote, currencyIn, currencyOut })

  if (!amounts) {
    return null
  }

  const outputCurrency = amounts.outputAmount.currency

  return {
    ...amounts,
    quote,
    routing: TradingApi.Routing.CLASSIC,
    tradeType,
    deadline,
    slippageTolerance: quote.quote.slippage ?? MAX_AUTO_SLIPPAGE_TOLERANCE,
    swapFee: getTradingApiSwapFee(quote),
    inputTax: getClassicInputTax(quote),
    outputTax: getClassicOutputTax(quote),
    priceImpact: getClassicPriceImpact(quote),
    quoteOutputAmount: getQuoteOutputAmount(quote, outputCurrency),
    quoteOutputAmountUserWillReceive: getQuoteOutputAmountUserWillReceive({
      quote,
      outputCurrency,
      recipient: quote.quote.swapper,
    }),
    indicative: false,
  }
}

function getClassicInputTax(quote: ClassicQuoteResponse): Percent {
  const sellFeeBps = quote.quote.route?.[0]?.[0]?.tokenIn?.sellFeeBps
  return sellFeeBps ? new PercentValue(sellFeeBps, '10000') : ZERO_PERCENT
}

function getClassicOutputTax(quote: ClassicQuoteResponse): Percent {
  const route = quote.quote.route?.[0]
  const buyFeeBps = route?.[route.length - 1]?.tokenOut?.buyFeeBps
  return buyFeeBps ? new PercentValue(buyFeeBps, '10000') : ZERO_PERCENT
}

function getClassicPriceImpact(quote: ClassicQuoteResponse): Percent | undefined {
  const quotePriceImpact = quote.quote.priceImpact
  return quotePriceImpact === undefined ? undefined : new PercentValue(Math.round(quotePriceImpact * 100), 10000)
}

export function getClassicQuoteOutputAmountUserWillReceive(
  trade: Pick<ClassicTrade, 'quote' | 'outputAmount'>,
): CurrencyAmount<Currency> {
  return getQuoteOutputAmountUserWillReceive({
    quote: trade.quote,
    outputCurrency: trade.outputAmount.currency,
    recipient: trade.quote.quote.swapper,
  })
}
