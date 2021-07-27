import { Currency, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade, FeeAmount, Trade, Route as V3Route, Pool } from '@uniswap/v3-sdk'
import { Fragment, memo, useContext } from 'react'
import { ChevronRight } from 'react-feather'
import { Flex } from 'rebass'
import { ThemeContext } from 'styled-components/macro'
import { TYPE } from '../../theme'
import { unwrappedToken } from 'utils/unwrappedToken'
import RoutingDiagram, { Route } from 'components/RoutingDiagram/RoutingDiagram'

function getTokenPath(trade: V3Trade<Currency, Currency, TradeType>): Route[] {
  return trade.swaps.map((swap) => ({
    percent: 50,
    path: swap.route.pools.map(({ token0, token1, fee }: Pool) => [token0, token1, fee]),
  }))
}

function LabeledArrow({}: { fee: FeeAmount }) {
  const theme = useContext(ThemeContext)

  // todo: render the fee in the label
  return <ChevronRight size={14} color={theme.text2} />
}

export default memo(function SwapRoute({
  trade,
}: {
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
}) {
  const theme = useContext(ThemeContext)

  if (trade instanceof V2Trade) {
    const tokenPath = trade.route.path
    return (
      <Flex flexWrap="wrap" width="100%" justifyContent="flex-start" alignItems="center">
        {tokenPath.map((token, i, path) => {
          const isLastItem: boolean = i === path.length - 1
          const currency = unwrappedToken(token)
          return (
            <Fragment key={i}>
              <Flex alignItems="end">
                <TYPE.black color={theme.text1} ml="0.145rem" mr="0.145rem">
                  {currency.symbol}
                </TYPE.black>
              </Flex>
              {isLastItem ? null : <ChevronRight size={14} color={theme.text2} />}
            </Fragment>
          )
        })}
      </Flex>
    )
  }

  return (
    <RoutingDiagram
      currencyIn={trade.inputAmount.currency}
      currencyOut={trade.outputAmount.currency}
      routes={getTokenPath(trade)}
    />
  )
})
