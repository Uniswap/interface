import { JSBI, Percent, Token, Trade } from '@uniswap/sdk'
import React, { useContext } from 'react'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ALLOWED_SLIPPAGE_HIGH, ALLOWED_SLIPPAGE_LOW, ALLOWED_SLIPPAGE_MEDIUM } from '../../constants'
import { Field } from '../../state/swap/actions'
import { AutoColumn } from '../Column'
import { ErrorText } from '../ExchangePage/styleds'
import { AutoRow, RowFixed } from '../Row'

export function warningServerity(priceImpact: Percent): 'low' | 'medium' | 'high' | undefined {
  if (!priceImpact?.lessThan(ALLOWED_SLIPPAGE_HIGH)) return 'high'
  if (!priceImpact?.lessThan(ALLOWED_SLIPPAGE_MEDIUM)) return 'medium'
  if (!priceImpact?.lessThan(ALLOWED_SLIPPAGE_LOW)) return 'low'
}

const MIN_PERCENT_IMPACT = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))

export default function PriceBar({ bestTrade, tokens }: { bestTrade?: Trade; tokens: { [field in Field]?: Token } }) {
  const theme = useContext(ThemeContext)
  const priceImpact = bestTrade?.slippage
  return (
    <AutoRow justify="space-between">
      <RowFixed>Rate info</RowFixed>
      <AutoColumn justify="center">
        <Text fontWeight={500} fontSize={16} color={theme.text2}>
          {bestTrade ? `${bestTrade.executionPrice.toSignificant(6)} ` : '-'}
        </Text>
        <Text fontWeight={500} fontSize={16} color={theme.text3} pt={1}>
          {tokens[Field.OUTPUT]?.symbol} / {tokens[Field.INPUT]?.symbol}
        </Text>
      </AutoColumn>
      <AutoColumn justify="center">
        <Text fontWeight={500} fontSize={16} color={theme.text2}>
          {bestTrade ? `${bestTrade.executionPrice.invert().toSignificant(6)} ` : '-'}
        </Text>
        <Text fontWeight={500} fontSize={16} color={theme.text3} pt={1}>
          {tokens[Field.INPUT]?.symbol} / {tokens[Field.OUTPUT]?.symbol}
        </Text>
      </AutoColumn>
      <AutoColumn justify="center">
        <ErrorText fontWeight={500} fontSize={16} severity={warningServerity(priceImpact)}>
          {priceImpact?.lessThan(MIN_PERCENT_IMPACT) ? '<0.01%' : `${priceImpact?.toFixed(2)}%` ?? '-'}
        </ErrorText>
        <Text fontWeight={500} fontSize={16} color={theme.text3} pt={1}>
          Price Impact
        </Text>
      </AutoColumn>
    </AutoRow>
  )
}
