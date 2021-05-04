import { Percent } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade, FeeAmount } from '@uniswap/v3-sdk'
import React, { Fragment, memo, useContext } from 'react'
import { ChevronLeft, ChevronRight } from 'react-feather'
import { Flex } from 'rebass'
import { ThemeContext } from 'styled-components'
import { TYPE } from '../../theme'
import { unwrappedToken } from 'utils/wrappedCurrency'

function LabeledArrow({ fee }: { fee: FeeAmount }) {
  const theme = useContext(ThemeContext)

  // todo: improve the rendering of this labeled arrow
  return (
    <>
      <ChevronLeft size={12} color={theme.text2} />
      <span style={{ fontSize: 12, marginTop: 2 }}>{new Percent(fee, 1_000_000).toSignificant()}%</span>
      <ChevronRight size={12} color={theme.text2} />
    </>
  )
}

export default memo(function SwapRoute({ trade }: { trade: V2Trade | V3Trade }) {
  const tokenPath = trade instanceof V2Trade ? trade.route.path : trade.route.tokenPath
  const theme = useContext(ThemeContext)
  return (
    <Flex flexWrap="wrap" width="100%" justifyContent="flex-start" alignItems="center">
      {tokenPath.map((token, i, path) => {
        const isLastItem: boolean = i === path.length - 1
        const currency = unwrappedToken(token)
        return (
          <Fragment key={i}>
            <Flex alignItems="end">
              <TYPE.black fontSize={12} color={theme.text1} ml="0.125rem" mr="0.125rem">
                {currency.symbol}
              </TYPE.black>
            </Flex>
            {isLastItem ? null : trade instanceof V2Trade ? (
              <ChevronRight size={12} color={theme.text2} />
            ) : (
              <LabeledArrow fee={trade.route.pools[i].fee} />
            )}
          </Fragment>
        )
      })}
    </Flex>
  )
})
