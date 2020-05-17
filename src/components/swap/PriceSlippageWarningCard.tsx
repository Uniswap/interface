import { Percent } from '@uniswap/sdk'
import React, { useContext } from 'react'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { YellowCard } from '../Card'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'

export function PriceSlippageWarningCard({ priceSlippage }: { priceSlippage: Percent }) {
  const theme = useContext(ThemeContext)
  return (
    <YellowCard style={{ padding: '20px', paddingTop: '10px' }}>
      <AutoColumn gap="md">
        <RowBetween>
          <RowFixed style={{ paddingTop: '8px' }}>
            <span role="img" aria-label="warning">
              ⚠️
            </span>{' '}
            <Text fontWeight={500} marginLeft="4px" color={theme.text1}>
              Price Warning
            </Text>
          </RowFixed>
        </RowBetween>
        <Text lineHeight="145.23%;" fontSize={16} fontWeight={400} color={theme.text1}>
          This trade will move the price by ~{priceSlippage.toFixed(2)}%.
        </Text>
      </AutoColumn>
    </YellowCard>
  )
}
