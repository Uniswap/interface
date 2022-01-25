import { Currency, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import React, { Fragment, memo, useContext } from 'react'
import { ChevronRight } from 'react-feather'
import { Flex } from 'rebass'
import { ThemeContext } from 'styled-components'
import { TYPE } from '../../theme'
import { unwrappedToken } from 'utils/wrappedCurrency'

function LabeledArrow() {
  const theme = useContext(ThemeContext)

  // todo: render the fee in the label
  return <ChevronRight size={14} color={theme.text2} />
}

export default memo(function SwapRoute({ trade }: { trade: V2Trade<Currency, Currency, TradeType> }) {
  const tokenPath = trade.route.path
  const theme = useContext(ThemeContext)
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
            {isLastItem ? null : trade instanceof V2Trade ? (
              <ChevronRight size={14} color={theme.text2} />
            ) : (
              <LabeledArrow />
            )}
          </Fragment>
        )
      })}
    </Flex>
  )
})
