import { Trade } from '@uniswap/sdk'
import React, { useContext } from 'react'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { V1_TRADE_LINK_THRESHOLD } from '../../constants'
import { useV1TradeLinkIfBetter } from '../../data/V1'
import { Link } from '../../theme'
import { YellowCard } from '../Card'
import { AutoColumn } from '../Column'

export default function V1TradeLink({ bestV2Trade }: { bestV2Trade?: Trade }) {
  const v1TradeLinkIfBetter = useV1TradeLinkIfBetter(bestV2Trade, V1_TRADE_LINK_THRESHOLD)
  const theme = useContext(ThemeContext)
  return v1TradeLinkIfBetter ? (
    <YellowCard style={{ marginTop: '12px', padding: '8px 4px' }}>
      <AutoColumn gap="sm" justify="center" style={{ alignItems: 'center', textAlign: 'center' }}>
        <Text lineHeight="145.23%;" fontSize={14} fontWeight={400} color={theme.text1}>
          There is a better price for this trade on
          <Link href={v1TradeLinkIfBetter}>
            <b> Uniswap V1 ↗</b>
          </Link>
        </Text>
      </AutoColumn>
    </YellowCard>
  ) : null
}
