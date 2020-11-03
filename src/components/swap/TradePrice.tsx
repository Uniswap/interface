import React from 'react'
import { Price } from 'dxswap-sdk'
import { Repeat } from 'react-feather'
import { StyledBalanceMaxMini } from './styleds'
import { TYPE } from '../../theme'

interface TradePriceProps {
  price?: Price
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  const formattedPrice = showInverted ? price?.toSignificant(6) : price?.invert()?.toSignificant(6)

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)
  const label = showInverted
    ? `${price?.quoteCurrency?.symbol} per ${price?.baseCurrency?.symbol}`
    : `${price?.baseCurrency?.symbol} per ${price?.quoteCurrency?.symbol}`

  return (
    <TYPE.body
      fontSize="12px"
      lineHeight="15px"
      fontWeight="500"
      style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
    >
      {show ? (
        <>
          {formattedPrice ?? '-'} {label}
          <StyledBalanceMaxMini style={{ marginLeft: 6 }} onClick={() => setShowInverted(!showInverted)}>
            <Repeat size={12} />
          </StyledBalanceMaxMini>
        </>
      ) : (
        '-'
      )}
    </TYPE.body>
  )
}
