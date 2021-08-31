import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { FeeAmount, Trade as V3Trade } from '@uniswap/v3-sdk'
import { AutoColumn } from 'components/Column'
import RoutingDiagram, { RoutingDiagramEntry } from 'components/RoutingDiagram/RoutingDiagram'
import { RowBetween } from 'components/Row'
import { memo } from 'react'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { RouterLabel } from './RouterLabel'

const Separator = styled.div`
  border-top: 1px solid ${({ theme }) => theme.bg2};
  width: 100%;
  height: 1px;
`

export default memo(function SwapRoute({
  trade,
}: {
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
}) {
  return (
    <AutoColumn gap="12px" style={{ padding: '0.5rem 0' }}>
      <RowBetween>
        <RouterLabel />
        <TYPE.black fontSize={14}>
          {trade instanceof V2Trade
            ? `Best route via V2`
            : trade.swaps.length === 1
            ? `Best route via V3`
            : `Best route via ${trade.swaps.length} hops on V3`}
        </TYPE.black>
      </RowBetween>
      <Separator />
      <RoutingDiagram
        currencyIn={trade.inputAmount.currency}
        currencyOut={trade.outputAmount.currency}
        routes={getTokenPath(trade)}
      />
    </AutoColumn>
  )
})

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

  return trade.swaps.map(({ route: { tokenPath, pools }, inputAmount }) => {
    const portion = inputAmount.divide(trade.inputAmount)
    const percent = new Percent(portion.numerator, portion.denominator)

    const path: [Currency, Currency, FeeAmount][] = []
    for (let i = 0; i < pools.length; i++) {
      const nextPool = pools[i]
      const tokenIn = tokenPath[i]
      const tokenOut = tokenPath[i + 1]

      path.push([tokenIn, tokenOut, nextPool.fee])
    }

    return {
      percent: percent,
      path,
    }
  })
}
