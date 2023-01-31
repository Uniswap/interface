import { Trans } from '@lingui/macro'
import React, { CSSProperties, useState } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'

import { BaseTradeInfo } from 'components/swapv2/LimitOrder/useBaseTradeInfo'
import { StyledBalanceMaxMini } from 'components/swapv2/styleds'
import useTheme from 'hooks/useTheme'
import { toFixed } from 'utils/numbers'

interface TradePriceProps {
  price: BaseTradeInfo | undefined
  style: CSSProperties
  label?: string
  color?: string
  symbolIn: string | undefined
  symbolOut: string | undefined
  loading: boolean
}

export default function TradePrice({ price, style = {}, label, color, symbolIn, symbolOut, loading }: TradePriceProps) {
  const theme = useTheme()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  let formattedPrice
  try {
    if (price) {
      formattedPrice = showInverted
        ? toFixed(parseFloat(price?.invertRate.toPrecision(6)))
        : toFixed(parseFloat(price?.marketRate.toPrecision(6)))
    }
  } catch (error) {}

  const show = Boolean(price?.marketRate && price?.invertRate && formattedPrice)
  const value = showInverted
    ? `1 ${symbolOut} = ${formattedPrice} ${symbolIn}`
    : `1 ${symbolIn} = ${formattedPrice} ${symbolOut}`

  return (
    <Text
      fontWeight={500}
      fontSize={12}
      color={theme.subText}
      sx={{ alignItems: 'center', display: 'flex', lineHeight: '14px', cursor: show ? 'pointer' : 'default', ...style }}
      onClick={() => setShowInverted(!showInverted)}
      height="22px"
    >
      {show ? (
        <>
          {label && <>{label}&nbsp;</>}
          <Text color={color}>{loading ? null : `${value}`}</Text>
          <StyledBalanceMaxMini>
            <Repeat size={12} />
          </StyledBalanceMaxMini>
        </>
      ) : (
        <Text color={theme.warning}>
          <Trans>Unable to get the market price</Trans>
        </Text>
      )}
    </Text>
  )
}
