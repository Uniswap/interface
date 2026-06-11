import { ZERO_PERCENT } from '@uniswap/router-sdk'
import type { Currency, Percent } from '@uniswap/sdk-core'
import { TradeType } from '@uniswap/sdk-core'
import type { ChainedQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import { getPlanCompoundSlippageTolerance } from 'uniswap/src/features/transactions/swap/plan/slippage'
import { type BaseTrade, createBaseTradeAmounts } from 'uniswap/src/features/transactions/swap/types/base'

export type ChainedActionTrade = BaseTrade<ChainedQuoteResponse, TradingApi.Routing.CHAINED> & {
  readonly indicative: false
  readonly tradeType: TradeType.EXACT_INPUT
  readonly swapFee: undefined
  readonly inputTax: Percent
  readonly outputTax: Percent
  readonly slippageTolerance: number
  readonly priceImpact: undefined
  readonly deadline: undefined
}

export function createChainedActionTrade({
  quote,
  currencyIn,
  currencyOut,
}: {
  quote: ChainedQuoteResponse
  currencyIn: Currency
  currencyOut: Currency
}): ChainedActionTrade | null {
  const amounts = createBaseTradeAmounts({ quote, currencyIn, currencyOut })

  if (!amounts) {
    return null
  }

  const slippageTolerance =
    getPlanCompoundSlippageTolerance(quote.quote.steps) ?? quote.quote.slippage ?? quote.quote.slippageTolerance ?? 0

  return {
    ...amounts,
    quote,
    routing: TradingApi.Routing.CHAINED,
    tradeType: TradeType.EXACT_INPUT,
    swapFee: undefined,
    inputTax: ZERO_PERCENT,
    outputTax: ZERO_PERCENT,
    slippageTolerance,
    priceImpact: undefined,
    deadline: undefined,
    quoteOutputAmount: amounts.outputAmount,
    quoteOutputAmountUserWillReceive: amounts.outputAmount,
    indicative: false,
  }
}
