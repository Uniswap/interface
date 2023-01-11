import { Currency, Price } from '@kyberswap/ks-sdk-core'
import React, { CSSProperties, useState } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { useCurrencyConvertedToNative } from 'utils/dmm'

import { StyledBalanceMaxMini } from './styleds'

interface TradePriceProps {
  price?: Price<Currency, Currency>
  style?: CSSProperties
  label?: string
  color?: string
}

export default function TradePrice({ price, style = {}, label, color }: TradePriceProps) {
  const theme = useTheme()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  let formattedPrice
  try {
    formattedPrice = showInverted ? price?.toSignificant(6) : price?.invert()?.toSignificant(6)
  } catch (error) {}

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency && formattedPrice)
  const nativeQuote = useCurrencyConvertedToNative(price?.quoteCurrency)
  const nativeBase = useCurrencyConvertedToNative(price?.baseCurrency)
  const value = showInverted
    ? `${nativeQuote?.symbol} = 1 ${nativeBase?.symbol}`
    : `${nativeBase?.symbol} = 1 ${nativeQuote?.symbol}`

  return (
    <Text
      fontWeight={500}
      fontSize={12}
      color={theme.subText}
      style={{ alignItems: 'center', display: 'flex', cursor: 'pointer', ...style }}
      onClick={() => setShowInverted(!showInverted)}
      height="22px"
    >
      {show ? (
        <>
          {label && <>{label}&nbsp;</>}
          <Text color={color}>
            {formattedPrice} {value}
          </Text>
          <StyledBalanceMaxMini>
            <Repeat size={12} />
          </StyledBalanceMaxMini>
        </>
      ) : (
        '-'
      )}
    </Text>
  )
}
