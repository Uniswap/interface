import { Currency, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { FeeAmount, Pool, Trade as V3Trade } from '@uniswap/v3-sdk'
import RoutingDiagram, { Route } from 'components/RoutingDiagram/RoutingDiagram'
import { memo } from 'react'

function getTokenPath(trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>): Route[] {
  // convert V2 path to a list of routes
  if (trade instanceof V2Trade) {
    const { path: tokenPath } = (trade as V2Trade<Currency, Currency, TradeType>).route
    const path = []
    for (let i = 1; i < tokenPath.length; i++) {
      path.push([tokenPath[i - 1], tokenPath[i], undefined] as [Currency, Currency, FeeAmount | undefined])
    }
    return [{ percent: 100, path }]
  }

  return trade.swaps.map((swap) => ({
    percent: 0, // TODO
    path: swap.route.pools.map(({ token0, token1, fee }: Pool) => [token0, token1, fee]),
  }))
}

export default memo(function SwapRoute({
  trade,
}: {
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
}) {
  return (
    <RoutingDiagram
      currencyIn={trade.inputAmount.currency}
      currencyOut={trade.outputAmount.currency}
      routes={getTokenPath(trade)}
    />
  )
})
