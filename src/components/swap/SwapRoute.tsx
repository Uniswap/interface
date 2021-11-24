import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount } from '@uniswap/v3-sdk'
import Badge, { BadgeVariant } from 'components/Badge'
import { AutoColumn } from 'components/Column'
import { LoadingRows } from 'components/Loader/styled'
import RoutingDiagram, { RoutingDiagramEntry } from 'components/RoutingDiagram/RoutingDiagram'
import { AutoRow, RowBetween } from 'components/Row'
import useAutoRouterSupported from 'hooks/useAutoRouterSupported'
import { Version } from 'hooks/useToggledVersion'
import { memo } from 'react'
import { Check } from 'react-feather'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'

import { AutoRouterLabel, AutoRouterLogo } from './RouterLabel'

const Separator = styled.div`
  border-top: 1px solid ${({ theme }) => theme.bg2};
  height: 1px;
  width: 100%;
`

const V2_DEFAULT_FEE_TIER = FeeAmount.MEDIUM

export default memo(function SwapRoute({
  trade,
  syncing,
}: {
  trade: Trade<Currency, Currency, TradeType>
  syncing: boolean
}) {
  const autoRouterSupported = useAutoRouterSupported()

  const routes = getTokenPath(trade)

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
          <Badge variant={BadgeVariant.POSITIVE}>
            <Check size={14} color="white" />
            <TYPE.white fontSize={12} marginLeft="4px">
              <Trans>Best Price</Trans>
            </TYPE.white>
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
          routes={routes}
        />
      )}
      {autoRouterSupported && (
        <TYPE.main fontSize={12} width={400}>
          {/* could not get <Plural> to render `one` correctly. */}
          {routes.length === 1 ? (
            <Trans>Best route via 1 hop on Uniswap V2 and V3</Trans>
          ) : (
            <Trans>Best route via {routes.length} hops on Uniswap V2 and V3</Trans>
          )}
        </TYPE.main>
      )}
    </AutoColumn>
  )
})

function getTokenPath(trade: Trade<Currency, Currency, TradeType>): RoutingDiagramEntry[] {
  return trade.swaps.map(({ route: { path: tokenPath, pools }, inputAmount, outputAmount }) => {
    const portion =
      trade.tradeType === TradeType.EXACT_INPUT
        ? inputAmount.divide(trade.inputAmount)
        : outputAmount.divide(trade.outputAmount)

    const percent = new Percent(portion.numerator, portion.denominator)

    const protocol = pools[0] instanceof Pair ? Version.v2 : Version.v3

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
