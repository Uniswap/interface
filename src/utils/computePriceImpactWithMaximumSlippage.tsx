import { computePriceImpact, Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'

export function computePriceImpactWithMaximumSlippage(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>,
  allowedSlippage: Percent
): Percent {
  return computePriceImpact(
    trade.route.midPrice,
    trade.maximumAmountIn(allowedSlippage),
    trade.minimumAmountOut(allowedSlippage)
  )
}
