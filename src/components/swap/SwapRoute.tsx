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
    <Flex px="20px" mt="16px" flexWrap="wrap" width="100%" justifyContent="space-evenly" alignItems="center">
      {trade.route.path.map((token, i, path) => {
        const isLastItem: boolean = i === path.length - 1
        return (
          <Fragment key={i}>
            <Flex my="0.5rem" alignItems="center" style={{ flexShrink: 0 }}>
              <CurrencyLogo currency={token} size="1.5rem" />
              <TYPE.black fontSize="14px" lineHeight="17px" fontWeight="600" color={theme.text1} ml="6px">
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
