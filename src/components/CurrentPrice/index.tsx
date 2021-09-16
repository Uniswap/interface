import React from 'react'
import { Currency, Price } from 'libs/sdk/src'
import { useContext } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { useCurrencyConvertedToNative } from 'utils/dmm'

interface CurrentPriceProps {
  price?: Price
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

export default function CurrentPrice({ price, showInverted, setShowInverted }: CurrentPriceProps) {
  const theme = useContext(ThemeContext)

  const formattedPrice = showInverted ? price?.toSignificant(4) : price?.invert()?.toSignificant(4)

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)
  const nativeQuote = useCurrencyConvertedToNative(price?.quoteCurrency as Currency)
  const nativeBase = useCurrencyConvertedToNative(price?.baseCurrency as Currency)
  const label = showInverted
    ? `1 ${nativeBase?.symbol} = ${formattedPrice ?? '-'} ${nativeQuote?.symbol}`
    : `1 ${nativeQuote?.symbol} = ${formattedPrice ?? '-'} ${nativeBase?.symbol}`

  return (
    <Text fontWeight={500} fontSize={14} style={{ alignItems: 'center', display: 'flex' }}>
      {show ? (
        <>
          <div style={{ marginRight: '8px' }}>{label}</div>
          <div onClick={() => setShowInverted(!showInverted)}>
            <Repeat size={14} color={theme.text1} />
          </div>
        </>
      ) : (
        '-'
      )}
    </Text>
  )
}
