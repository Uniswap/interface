import React from 'react'
import { Trade } from '@uniswap/sdk'
import { useContext } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { StyledBalanceMaxMini } from './styleds'

interface TradePriceProps {
  trade?: Trade
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

export default function TradePrice({ trade, showInverted, setShowInverted }: TradePriceProps) {
  const theme = useContext(ThemeContext)
  const inputToken = trade?.inputAmount?.token
  const outputToken = trade?.outputAmount?.token

  const price = showInverted
    ? trade?.executionPrice?.toSignificant(6)
    : trade?.executionPrice?.invert()?.toSignificant(6)

  const label = showInverted
    ? `${outputToken?.symbol} per ${inputToken?.symbol}`
    : `${inputToken?.symbol} per ${outputToken?.symbol}`

  return (
    <Text
      fontWeight={500}
      fontSize={14}
      color={theme.text2}
      style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
    >
      {price && `${price} ${label}`}
      <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
        <Repeat size={14} />
      </StyledBalanceMaxMini>
    </Text>
  )
}
