import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { FeeAmount, Trade as V3Trade } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import { AutoColumn } from 'components/Column'
import { LoadingRows } from 'components/Loader/styled'
import RoutingDiagram, { RoutingDiagramEntry } from 'components/RoutingDiagram/RoutingDiagram'
import { AutoRow, RowBetween } from 'components/Row'
import { Version } from 'hooks/useToggledVersion'
import { memo } from 'react'
import { useRoutingAPIEnabled } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { getTradeVersion } from 'utils/getTradeVersion'

import { AutoRouterLabel, AutoRouterLogo } from './RouterLabel'

const Separator = styled.div`
  border-top: 1px solid ${({ theme }) => theme.bg2};
  height: 1px;
  width: 100%;
`

const V2_DEFAULT_FEE_TIER = 3000

export default memo(function SwapRoute({
  trade,
  syncing,
}: {
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
  syncing: boolean
}) {
  const routingAPIEnabled = useRoutingAPIEnabled()

  return (
    <AutoColumn gap="12px">
      <RowBetween>
        <AutoRow gap="4px" width="auto">
          <AutoRouterLogo />
          <AutoRouterLabel />
        </AutoRow>
        {syncing ? (
          <LoadingRows>
            <div style={{ width: '30px', height: '24px' }} />
          </LoadingRows>
        ) : (
          <Badge>
            <TYPE.black fontSize={12}>
              {getTradeVersion(trade) === Version.v2 ? <Trans>V2</Trans> : <Trans>V3</Trans>}
            </TYPE.black>
          </Badge>
        )}
      </RowBetween>
      <Separator />
      {syncing ? (
        <LoadingRows>
          <div style={{ width: '400px', height: '30px' }} />
        </LoadingRows>
      ) : (
        <RoutingDiagram
          currencyIn={trade.inputAmount.currency}
          currencyOut={trade.outputAmount.currency}
          routes={getTokenPath(trade)}
        />
      )}
      {routingAPIEnabled && (
        <TYPE.main fontSize={12} width={400}>
          <Trans>This route optimizes your price by considering split routes, multiple hops, and gas costs.</Trans>
        </TYPE.main>
      )}
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
      path.push([tokenPath[i - 1], tokenPath[i], V2_DEFAULT_FEE_TIER] as RoutingDiagramEntry['path'][0])
    }
    return [{ percent: new Percent(100, 100), path }]
  }

  return trade.swaps.map(({ route: { tokenPath, pools }, inputAmount, outputAmount }) => {
    const portion =
      trade.tradeType === TradeType.EXACT_INPUT
        ? inputAmount.divide(trade.inputAmount)
        : outputAmount.divide(trade.outputAmount)

    const percent = new Percent(portion.numerator, portion.denominator)

    const path: [Currency, Currency, FeeAmount][] = []
    for (let i = 0; i < pools.length; i++) {
      const nextPool = pools[i]
      const tokenIn = tokenPath[i]
      const tokenOut = tokenPath[i + 1]

      path.push([tokenIn, tokenOut, nextPool.fee])
    }

    return {
      percent,
      path,
    }
  })
}
