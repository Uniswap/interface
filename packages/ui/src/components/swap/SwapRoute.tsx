import { Trade } from '@teleswap/sdk'
import useThemedContext from 'hooks/useThemedContext'
import React, { Fragment, memo } from 'react'
import { ChevronRight } from 'react-feather'
import { Flex } from 'rebass'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { TYPE } from '../../theme'

export default memo(function SwapRoute({ trade }: { trade: Trade }) {
  const theme = useThemedContext()
  return (
    <Flex flexWrap="wrap" width="100%" justifyContent="flex-end" alignItems="center">
      {trade.route.path.map((token, i, path) => {
        const isLastItem: boolean = i === path.length - 1
        const currency = unwrappedToken(token)
        return (
          <Fragment key={i}>
            <Flex alignItems="end">
              <TYPE.black className="text-detail" color={theme.text1} ml="0.125rem" mr="0.125rem">
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
