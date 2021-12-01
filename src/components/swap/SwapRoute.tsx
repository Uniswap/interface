import { Trans } from '@lingui/macro'
import { Protocol, Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { AutoColumn } from 'components/Column'
import { LoadingRows } from 'components/Loader/styled'
import RoutingDiagram, { RoutingDiagramEntry } from 'components/RoutingDiagram/RoutingDiagram'
import { AutoRow, RowBetween } from 'components/Row'
import useAutoRouterSupported from 'hooks/useAutoRouterSupported'
import { memo } from 'react'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'

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
  trade: Trade<Currency, Currency, TradeType>
  syncing: boolean
}) {
  const autoRouterSupported = useAutoRouterSupported()

  const routes = getTokenPath(trade)

  const hasV2Routes = routes.some((r) => r.protocol === Protocol.V2)
  const hasV3Routes = routes.some((r) => r.protocol === Protocol.V3)

  return (
    <AutoColumn gap="12px">
      <RowBetween>
        <AutoRow gap="4px" width="auto">
          <AutoRouterLogo />
          <AutoRouterLabel />
        </AutoRow>
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
          routes={routes}
        />
      )}
      {autoRouterSupported &&
        (syncing ? (
          <LoadingRows>
            <div style={{ width: '250px', height: '15px' }} />
          </LoadingRows>
        ) : (
          <TYPE.main fontSize={12} width={400}>
            {/* could not get <Plural> to render `one` correctly. */}
            {routes.length === 1 ? (
              hasV2Routes && hasV3Routes ? (
                <Trans>Best trade via one route on Uniswap V2 and V3</Trans>
              ) : (
                <Trans>Best trade via one route on Uniswap {hasV2Routes ? 'V2' : 'V3'}</Trans>
              )
            ) : hasV2Routes && hasV3Routes ? (
              <Trans>Best trade via {routes.length} routes on Uniswap V2 and V3</Trans>
            ) : (
              <Trans>
                Best trade via {routes.length} routes on Uniswap {hasV2Routes ? 'V2' : 'V3'}
              </Trans>
            )}
          </TYPE.main>
        ))}
    </AutoColumn>
  )
})

function getTokenPath(trade: Trade<Currency, Currency, TradeType>): RoutingDiagramEntry[] {
  return trade.swaps.map(({ route: { path: tokenPath, pools, protocol }, inputAmount, outputAmount }) => {
    const portion =
      trade.tradeType === TradeType.EXACT_INPUT
        ? inputAmount.divide(trade.inputAmount)
        : outputAmount.divide(trade.outputAmount)

    const percent = new Percent(portion.numerator, portion.denominator)

    const path: RoutingDiagramEntry['path'] = []
    for (let i = 0; i < pools.length; i++) {
      const nextPool = pools[i]
      const tokenIn = tokenPath[i]
      const tokenOut = tokenPath[i + 1]

      const entry: RoutingDiagramEntry['path'][0] = [
        tokenIn,
        tokenOut,
        nextPool instanceof Pair ? V2_DEFAULT_FEE_TIER : nextPool.fee,
      ]

      path.push(entry)
    }

    return {
      percent,
      path,
      protocol,
    }
  })
}
