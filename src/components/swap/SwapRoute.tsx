import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import AnimatedDropdown from 'components/AnimatedDropdown'
import { AutoColumn } from 'components/Column'
import { LoadingRows } from 'components/Loader/styled'
import RoutingDiagram, { RoutingDiagramEntry } from 'components/RoutingDiagram/RoutingDiagram'
import { AutoRow, RowBetween } from 'components/Row'
import { memo, useState } from 'react'
import { Plus } from 'react-feather'
import { useDarkModeManager } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { Separator } from 'theme'

import { AutoRouterLabel, AutoRouterLogo } from './RouterLabel'

const Wrapper = styled(AutoColumn)<{ darkMode?: boolean; fixedOpen?: boolean }>`
  padding: ${({ fixedOpen }) => (fixedOpen ? '12px' : '12px 8px 12px 12px')};
  border-radius: 16px;
  border: 1px solid ${({ theme, fixedOpen }) => (fixedOpen ? 'transparent' : theme.bg2)};
  cursor: pointer;
`

const OpenCloseIcon = styled(Plus)<{ open?: boolean }>`
  margin-left: 8px;
  height: 20px;
  stroke-width: 2px;
  transition: transform 0.1s;
  transform: ${({ open }) => (open ? 'rotate(45deg)' : 'none')};
  stroke: ${({ theme }) => theme.text3};
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`

const V2_DEFAULT_FEE_TIER = 3000

interface SwapRouteProps extends React.HTMLAttributes<HTMLDivElement> {
  trade: V2Trade<Currency, Currency, TradeType>
  syncing: boolean
  fixedOpen?: boolean // fixed in open state, hide open/close icon
}

export default memo(function SwapRoute({ trade, syncing, fixedOpen = false, ...rest }: SwapRouteProps) {
  const route = getTokenPath(trade)
  const [open, setOpen] = useState(false)

  const [darkMode] = useDarkModeManager()

  return (
    <Wrapper {...rest} darkMode={darkMode} fixedOpen={fixedOpen}>
      <RowBetween onClick={() => setOpen(!open)}>
        <AutoRow gap="4px" width="auto">
          <AutoRouterLogo />
          <AutoRouterLabel />
        </AutoRow>
        {fixedOpen ? null : <OpenCloseIcon open={open} />}
      </RowBetween>
      <AnimatedDropdown open={open || fixedOpen}>
        <AutoRow gap="4px" width="auto" style={{ paddingTop: '12px', margin: 0 }}>
          {syncing ? (
            <LoadingRows>
              <div style={{ width: '400px', height: '30px' }} />
            </LoadingRows>
          ) : (
            <RoutingDiagram
              currencyIn={trade.inputAmount.currency}
              currencyOut={trade.outputAmount.currency}
              route={route}
            />
          )}
          <Separator />
        </AutoRow>
      </AnimatedDropdown>
    </Wrapper>
  )
})

function getTokenPath(trade: V2Trade<Currency, Currency, TradeType>): RoutingDiagramEntry {
  const pools = trade.route.pairs
  const paths = trade.route.path
  const portion = trade.tradeType === TradeType.EXACT_INPUT ? trade.inputAmount : trade.outputAmount
  const percent = new Percent(portion.numerator, portion.denominator).divide(portion.decimalScale)

  const path: RoutingDiagramEntry['path'] = []
  for (let i = 0; i < pools.length; i++) {
    const tokenIn = paths[i]
    const tokenOut = paths[i + 1]

    const entry: RoutingDiagramEntry['path'][0] = [tokenIn, tokenOut, V2_DEFAULT_FEE_TIER]

    path.push(entry)
  }

  return {
    percent,
    path,
  }
}
