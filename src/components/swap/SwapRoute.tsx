import { Trade } from '@uniswap/sdk'
import React, { Fragment, memo, useContext } from 'react'
import { ChevronRight } from 'react-feather'
import { Flex } from 'rebass'
import { ThemeContext } from 'styled-components'
import { TYPE } from '../../theme'
import TokenLogo from '../TokenLogo'

export default memo(function SwapRoute({ trade }: { trade: Trade }) {
  const theme = useContext(ThemeContext)
  return (
    <Flex
      px="1rem"
      py="0.5rem"
      my="0.5rem"
      style={{ border: `1px solid ${theme.bg3}`, borderRadius: '1rem' }}
      flexWrap="wrap"
      width="100%"
      justifyContent="space-evenly"
      alignItems="center"
    >
      {trade.route.path.map((token, i, path) => {
        const isLastItem: boolean = i === path.length - 1
        return (
          <Fragment key={i}>
            <Flex my="0.5rem" alignItems="center" key={token.address} style={{ flexShrink: 0 }}>
              <TokenLogo address={token.address} size="1.5rem" />
              <TYPE.black fontSize={14} color={theme.text1} ml="0.5rem">
                {token.symbol}
              </TYPE.black>
            </Flex>
            {isLastItem ? null : <ChevronRight key={i} color={theme.text2} />}
          </Fragment>
        )
      })}
    </Flex>
  )
})
