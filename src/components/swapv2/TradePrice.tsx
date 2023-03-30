import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { ReactNode, useState } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { CSSProperties } from 'styled-components'

import useTheme from 'hooks/useTheme'
import { useCurrencyConvertedToNative } from 'utils/dmm'

import { Dots, StyledBalanceMaxMini } from './styleds'

interface TradePriceProps {
  price: Price<Currency, Currency> | undefined
  label?: ReactNode
  icon?: ReactNode
  style?: CSSProperties
  color?: string
}

export default function TradePrice({ price, label, icon, style = {}, color }: TradePriceProps) {
  const theme = useTheme()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  let formattedPrice
  try {
    formattedPrice = showInverted ? price?.invert()?.toSignificant(6) : price?.toSignificant(6)
  } catch (error) {}

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency && formattedPrice)
  const nativeQuote = useCurrencyConvertedToNative(price?.quoteCurrency)
  const nativeBase = useCurrencyConvertedToNative(price?.baseCurrency)
  const value = showInverted
    ? `1 ${nativeQuote?.symbol} = ${formattedPrice} ${nativeBase?.symbol}`
    : `1 ${nativeBase?.symbol} = ${formattedPrice} ${nativeQuote?.symbol}`

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
          {label && <>{label}&nbsp;</>} <Text color={color}>{value}</Text>
          <StyledBalanceMaxMini>{icon || <Repeat size={12} />}</StyledBalanceMaxMini>
        </>
      ) : (
        <Dots>
          <Trans>Calculating</Trans>
        </Dots>
      )}
    </Text>
  )
}
