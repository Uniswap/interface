import { Trade } from '@ubeswap/sdk'
import React, { Fragment, memo, useContext } from 'react'
import { ChevronRight } from 'react-feather'
import { Flex } from 'rebass'
import { ThemeContext } from 'styled-components'

import { TYPE } from '../../theme'
import { MinimaRouterTrade, UbeswapTrade } from './routing/trade'

export default memo(function SwapRoute({ trade }: { trade: Trade }) {
  const theme = useContext(ThemeContext)
  const path = trade instanceof MinimaRouterTrade || trade instanceof UbeswapTrade ? trade.path : trade.route.path
  return (
    <Flex flexWrap="wrap" width="100%" justifyContent="flex-end" alignItems="center">
      {path.map((token, i, path) => {
        const isLastItem: boolean = i === path.length - 1
        const currency = token
        return (
          <Fragment key={i}>
            <Flex alignItems="end">
              <TYPE.black fontSize={14} color={theme.text1} ml="0.125rem" mr="0.125rem">
                {currency.symbol}
              </TYPE.black>
            </Flex>
            {isLastItem ? null : <ChevronRight size={12} color={theme.text2} />}
          </Fragment>
        )
      })}
    </Flex>
  )
})
