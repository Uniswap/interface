import { ZERO_PERCENT } from '@uniswap/router-sdk'
import type { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import type { BridgeQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import {
  type BaseTrade,
  createCurrencyAmount,
  createBaseTradeAmounts,
} from 'uniswap/src/features/transactions/swap/types/base'
import { getTradingApiSwapFee } from 'uniswap/src/features/transactions/swap/types/getTradingApiSwapFee'

export type BridgeTrade = BaseTrade<BridgeQuoteResponse, TradingApi.Routing.BRIDGE> & {
  readonly indicative: false
  readonly inputTax: Percent
  readonly outputTax: Percent
  readonly slippageTolerance: undefined
  readonly priceImpact: undefined
  readonly deadline: undefined
}

export function createBridgeTrade({
  quote,
  currencyIn,
  currencyOut,
  tradeType,
}: {
  quote: BridgeQuoteResponse
  currencyIn: Currency
  currencyOut: Currency
  tradeType: TradeType
}): BridgeTrade | null {
  const amounts = createBaseTradeAmounts({ quote, currencyIn, currencyOut })

  if (!amounts) {
    return null
  }

  const swapFee = getTradingApiSwapFee(quote)

  return {
    ...amounts,
    quote,
    routing: TradingApi.Routing.BRIDGE,
    tradeType,
    swapFee,
    inputTax: ZERO_PERCENT,
    outputTax: ZERO_PERCENT,
    slippageTolerance: undefined,
    priceImpact: undefined,
    deadline: undefined,
    quoteOutputAmount: amounts.outputAmount,
    quoteOutputAmountUserWillReceive: getBridgeQuoteOutputAmountUserWillReceive({
      outputAmount: amounts.outputAmount,
      swapFeeAmount: swapFee?.amount,
    }),
    indicative: false,
  }
}

function getBridgeQuoteOutputAmountUserWillReceive({
  outputAmount,
  swapFeeAmount,
}: {
  outputAmount: CurrencyAmount<Currency>
  swapFeeAmount: string | undefined
}): CurrencyAmount<Currency> {
  const feeAmount = swapFeeAmount ? createCurrencyAmount(outputAmount.currency, swapFeeAmount) : null
  return feeAmount ? outputAmount.add(feeAmount) : outputAmount
}
