import { CurrencyAmount, Percent, Price } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'

function computePriceImpact(midPrice: Price, inputAmount: CurrencyAmount, outputAmount: CurrencyAmount): Percent {
  const exactQuote = midPrice.raw.multiply(inputAmount.raw)
  // calculate slippage := (exactQuote - outputAmount) / exactQuote
  const slippage = exactQuote.subtract(outputAmount.raw).divide(exactQuote)
  return new Percent(slippage.numerator, slippage.denominator)
}

export function computePriceImpactWithMaximumSlippage(trade: V2Trade | V3Trade, allowedSlippage: Percent): Percent {
  return computePriceImpact(
    trade.route.midPrice,
    trade.maximumAmountIn(allowedSlippage),
    trade.minimumAmountOut(allowedSlippage)
  )
}
