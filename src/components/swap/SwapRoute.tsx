import { Trade } from 'dxswap-sdk'
import React, { Fragment, memo, useContext } from 'react'
import { ChevronRight } from 'react-feather'
import { Flex } from 'rebass'
import { ThemeContext } from 'styled-components'
import { TYPE } from '../../theme'
import CurrencyLogo from '../CurrencyLogo'

export default memo(function SwapRoute({ trade }: { trade: Trade }) {
  const theme = useContext(ThemeContext)
  return (
    <Flex ml="12px" width="100%" justifyContent="space-evenly" alignItems="center">
      {trade.route.path.map((token, i, path) => {
        const isLastItem: boolean = i === path.length - 1
        return (
          <Fragment key={i}>
            <Flex alignItems="center">
              <CurrencyLogo currency={token} size="14px" />
              <TYPE.black fontSize="13px" lineHeight="17px" fontWeight="600" color={theme.text1} ml="4px">
                {token.symbol}
              </TYPE.black>
            </Flex>
            {isLastItem ? null : <ChevronRight height="17px" color={theme.purple3} />}
          </Fragment>
        )
      })}
    </Flex>
  )
})
