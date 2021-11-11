import React, { useContext, useState } from 'react'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'

import { Currency, Price } from '@dynamic-amm/sdk'
import { ButtonEmpty } from 'components/Button'
import SwitchIcon from 'components/Icons/SwitchIcon'
import { useCurrencyConvertedToNative } from 'utils/dmm'

interface CurrentPriceProps {
  price?: Price
}

export default function CurrentPrice({ price }: CurrentPriceProps) {
  const theme = useContext(ThemeContext)
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const formattedPrice = showInverted ? price?.toSignificant(4) : price?.invert()?.toSignificant(4)

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)
  const nativeQuote = useCurrencyConvertedToNative(price?.quoteCurrency as Currency)
  const nativeBase = useCurrencyConvertedToNative(price?.baseCurrency as Currency)
  const label = showInverted
    ? `1 ${nativeBase?.symbol} = ${formattedPrice ?? '-'} ${nativeQuote?.symbol}`
    : `1 ${nativeQuote?.symbol} = ${formattedPrice ?? '-'} ${nativeBase?.symbol}`

  return (
    <Text fontWeight={400} fontSize={14}>
      {show ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ marginRight: '4px' }}>{label}</div>
          <ButtonEmpty
            padding="0"
            width="fit-content"
            onClick={() => setShowInverted && setShowInverted(!showInverted)}
          >
            <SwitchIcon color={theme.text} />
          </ButtonEmpty>
        </div>
      ) : (
        '-'
      )}
    </Text>
  )
}
