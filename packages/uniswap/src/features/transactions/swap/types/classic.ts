import { ZERO_PERCENT } from '@uniswap/router-sdk'
import type { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Percent as PercentValue } from '@uniswap/sdk-core'
import type { ClassicQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import { MAX_AUTO_SLIPPAGE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { type BaseTrade, createBaseTradeAmounts } from 'uniswap/src/features/transactions/swap/types/base'
import {
  getQuoteOutputAmount,
  getQuoteOutputAmountUserWillReceive,
} from 'uniswap/src/features/transactions/swap/types/getQuoteOutputAmount'
import { getTradingApiSwapFee } from 'uniswap/src/features/transactions/swap/types/getTradingApiSwapFee'

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
    inputTax: getClassicInputTax(currencyIn),
    outputTax: getClassicOutputTax(currencyOut),
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

// FOT (fee-on-transfer) taxes are read from the input/output currencies, which carry
// `buyFeeBps`/`sellFeeBps` populated from token fee data (see `buildCurrency`), rather than
// from the quote response route.
function getClassicInputTax(currencyIn: Currency): Percent {
  const sellFeeBps = currencyIn.wrapped.sellFeeBps
  return sellFeeBps?.gt(0) ? new PercentValue(sellFeeBps.toString(), '10000') : ZERO_PERCENT
}

function getClassicOutputTax(currencyOut: Currency): Percent {
  const buyFeeBps = currencyOut.wrapped.buyFeeBps
  return buyFeeBps?.gt(0) ? new PercentValue(buyFeeBps.toString(), '10000') : ZERO_PERCENT
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
