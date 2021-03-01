import React from 'react'
import { Price } from 'libs/sdk'
import { useContext } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { StyledBalanceMaxMini } from './styleds'

interface TradePriceProps {
  price?: Price
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  const theme = useContext(ThemeContext)

  const formattedPrice = showInverted ? price?.toSignificant(6) : price?.invert()?.toSignificant(6)

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)
  const label = showInverted
    ? `${price?.quoteCurrency?.symbol} = 1 ${price?.baseCurrency?.symbol}`
    : `${price?.baseCurrency?.symbol} = 1 ${price?.quoteCurrency?.symbol}`

  return (
    <Text
      fontWeight={500}
      fontSize={14}
      color={theme.text2}
      style={{ alignItems: 'center', display: 'flex' }}
    >
      {show ? (
        <>
          {formattedPrice ?? '-'} {label}
          <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
            <Repeat size={14} color={theme.primary1} />
          </StyledBalanceMaxMini>
        </>
      ) : (
        '-'
      )}
    </Text>
  )
}
