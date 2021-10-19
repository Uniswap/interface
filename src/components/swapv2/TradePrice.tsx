import React from 'react'
import { Currency, Price } from '@dynamic-amm/sdk'
import { useContext } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { StyledBalanceMaxMini } from './styleds'
import { useCurrencyConvertedToNative } from 'utils/dmm'

interface TradePriceProps {
  price?: Price
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  const theme = useContext(ThemeContext)

  const formattedPrice = showInverted ? price?.toSignificant(6) : price?.invert()?.toSignificant(6)

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)
  const nativeQuote = useCurrencyConvertedToNative(price?.quoteCurrency as Currency)
  const nativeBase = useCurrencyConvertedToNative(price?.baseCurrency as Currency)
  const label = showInverted
    ? `${nativeQuote?.symbol} = 1 ${nativeBase?.symbol}`
    : `${nativeBase?.symbol} = 1 ${nativeQuote?.symbol}`

  return (
    <Text fontWeight={500} fontSize={14} color={theme.text2} style={{ alignItems: 'center', display: 'flex' }}>
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
