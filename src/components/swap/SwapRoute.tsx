import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { FeeAmount, Trade as V3Trade } from '@uniswap/v3-sdk'
import { DarkCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import RoutingDiagram, { RoutingDiagramEntry } from 'components/RoutingDiagram/RoutingDiagram'
import { AutoRow, RowBetween } from 'components/Row'
import { memo, useState } from 'react'
import { Box } from 'rebass'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { ReactComponent as AutoRouterIcon } from '../../assets/svg/auto_router.svg'

const Wrapper = styled(Box)`
  cursor: pointer;
  position: absolute;
  top: -24px;
  z-index: 999;
`

const Card = styled(DarkCard)<{ hovered: boolean }>`
  background-color: ${({ hovered, theme }) => (hovered ? theme.bg0 : 'transparent')};
  border: 1px solid ${({ hovered, theme }) => (hovered ? theme.bg2 : 'transparent')};
  /* padding: 0.5rem; */
  width: 400px;

  /* transition: border 0.2s ease-in-out, background-color 0.2s ease-in-out; */
`

const Separator = styled.div`
  border-top: 1px solid ${({ theme }) => theme.bg2};
  width: 100%;
  height: 1px;
`

const StyledAutoRouterIcon = styled(AutoRouterIcon)`
  height: 16px;
  width: 16px;
  stroke: #2172e5;
`

const GradientText = styled(TYPE.black)`
  /* fallback color */
  color: ${({ theme }) => theme.green1};

  @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {
    background-image: linear-gradient(90deg, #2172e5 0%, #54e521 163.16%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

function AutoRouterLabel() {
  return (
    <AutoRow gap="4px" width="auto">
      <StyledAutoRouterIcon />
      <GradientText fontSize={14}>Auto Router</GradientText>
    </AutoRow>
  )
}

export default memo(function SwapRoute({
  trade,
}: {
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
}) {
  const [showRoute, setShowRoute] = useState(false)

  return (
    <Wrapper onMouseOver={() => setShowRoute(true)} onMouseOut={() => setShowRoute(false)}>
      <Card hovered={showRoute}>
        <AutoColumn gap="16px">
          <RowBetween>
            <AutoRouterLabel />
            {showRoute && (
              <TYPE.black fontSize={14}>
                {trade instanceof V2Trade
                  ? `Best route via ${trade.route.path.length} hops`
                  : trade.swaps.length === 1
                  ? `Best route via ${trade.swaps[0].route.pools.length} hops`
                  : `Best route via ${trade.swaps.length} splits`}
              </TYPE.black>
            )}
          </RowBetween>
          {showRoute && (
            <>
              <Separator />
              <RoutingDiagram
                currencyIn={trade.inputAmount.currency}
                currencyOut={trade.outputAmount.currency}
                routes={getTokenPath(trade)}
              />
            </>
          )}
        </AutoColumn>
      </Card>
    </Wrapper>
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
