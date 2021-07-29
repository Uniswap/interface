import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { FeeAmount, Trade as V3Trade } from '@uniswap/v3-sdk'
import RoutingDiagram, { RoutingDiagramEntry } from 'components/RoutingDiagram/RoutingDiagram'
import { memo } from 'react'

function getTokenPath(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
): RoutingDiagramEntry[] {
  // convert V2 path to a list of routes
  if (trade instanceof V2Trade) {
    const { path: tokenPath } = (trade as V2Trade<Currency, Currency, TradeType>).route
    const path = []
    for (let i = 1; i < tokenPath.length; i++) {
      path.push([tokenPath[i - 1], tokenPath[i], undefined] as [Currency, Currency, FeeAmount | undefined])
    }
    return [{ percent: new Percent(100, 100), path }]
  }

  const total = trade.swaps.reduce(
    (acc, { inputAmount }) => inputAmount.add(acc),
    CurrencyAmount.fromRawAmount(trade.swaps[0].inputAmount.currency, 0)
  )

  return trade.swaps.map(({ route: { tokenPath, pools }, inputAmount }) => {
    const portion = inputAmount.divide(total)
    const percent = new Percent(portion.numerator, portion.denominator)

    const path: [Currency, Currency, FeeAmount][] = []
    for (let i = 1; i < tokenPath.length; i++) {
      const pool = pools.find((p) => {
        const addresses = [p.token0.address, p.token1.address]
        return addresses.includes(tokenPath[i - 1].address) && addresses.includes(tokenPath[i].address)
      })

      if (!pool) throw new Error(`Pool not found: ${tokenPath[i - 1].address}/${tokenPath[i].address}`)

      path.push([tokenPath[i - 1], tokenPath[i], pool.fee])
    }

    return {
      percent: percent,
      path,
    }
  })
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
