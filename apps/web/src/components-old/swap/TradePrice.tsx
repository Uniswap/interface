import { Currency, Price } from '@ubeswap/sdk-core'
import JSBI from 'jsbi'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { useTheme } from 'styled-components'

import { StyledBalanceMaxMini } from './styleds'

interface TradePriceProps {
  price?: Price<Currency, Currency>
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  const theme = useTheme()

  let formattedPrice
  if (price) {
    if (showInverted) {
      if (!JSBI.equal(price.denominator, JSBI.BigInt(0))) {
        formattedPrice = price.toSignificant(6)
      }
    } else {
      if (!JSBI.equal(price.numerator, JSBI.BigInt(0))) {
        formattedPrice = price.invert().toSignificant(6)
      }
    }
  }

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)
  const label = showInverted
    ? `${price?.quoteCurrency?.symbol} per ${price?.baseCurrency?.symbol}`
    : `${price?.baseCurrency?.symbol} per ${price?.quoteCurrency?.symbol}`

  return (
    <Text
      fontWeight={500}
      fontSize={14}
      color={theme.text2}
      style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
    >
      {show ? (
        <>
          {formattedPrice ?? '-'} {label}
          <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
            <Repeat size={14} />
          </StyledBalanceMaxMini>
        </>
      ) : (
        '-'
      )}
    </Text>
  )
}
