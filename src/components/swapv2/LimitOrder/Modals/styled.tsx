import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { Swap as SwapIcon } from 'components/Icons'
import TradePrice from 'components/swapv2/LimitOrder/TradePrice'
import { BaseTradeInfo } from 'components/swapv2/LimitOrder/useBaseTradeInfo'
import useTheme from 'hooks/useTheme'

import { formatAmountOrder, formatRateLimitOrder } from '../helpers'
import { LimitOrder, RateInfo } from '../type'

export const Container = styled.div`
  padding: 25px 30px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 25px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size:14px;
    padding: 16px 20px;
  `};
`

export const Value = styled.div`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
  display: flex;
  gap: 5px;
  align-items: center;
  text-align: right;
  font-size: 14px;
`
const Row = styled.div`
  line-height: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

export const Label = styled.div`
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
  font-size: 14px;
`

export const Header = ({ title, onDismiss }: { title: string; onDismiss: () => void }) => {
  const theme = useTheme()
  return (
    <Flex justifyContent={'space-between'}>
      <Flex color={theme.text} alignItems="center" style={{ gap: 8 }}>
        <Text fontSize={20}>{title}</Text>
      </Flex>
      <X onClick={onDismiss} style={{ cursor: 'pointer' }} color={theme.subText} />
    </Flex>
  )
}

export const Note = ({ note }: { note?: string }) => {
  const theme = useTheme()
  return note ? (
    <Text fontSize={12} fontStyle="italic" color={theme.subText}>
      {note}
    </Text>
  ) : null
}

type ListDataType = { label: string; content: ReactNode }[]
export function ListInfo({ listData }: { listData: ListDataType }) {
  return (
    <Flex style={{ gap: 14 }} flexDirection="column">
      {listData.map(item => (
        <Row key={item.label}>
          <Label>{item.label}</Label>
          {item.content}
        </Row>
      ))}
    </Flex>
  )
}
export const MarketInfo = ({
  marketPrice,
  symbolIn,
  symbolOut,
}: {
  marketPrice: BaseTradeInfo | undefined
  symbolIn: string | undefined
  symbolOut: string | undefined
}) => {
  const theme = useTheme()
  return (
    <Flex
      flexDirection={'column'}
      style={{
        borderRadius: 16,
        padding: '14px 16px',
        border: `1px solid ${theme.border}`,
      }}
    >
      <Row>
        <Label style={{ fontSize: 12 }}>
          <Trans>Estimated Market Price</Trans>
        </Label>
        <Value style={{ maxWidth: '60%' }}>
          <TradePrice
            price={marketPrice}
            loading={false}
            style={{ color: theme.text }}
            symbolIn={symbolIn}
            symbolOut={symbolOut}
          />
        </Value>
      </Row>
    </Flex>
  )
}
export const Rate = ({
  currencyIn,
  currencyOut,
  rateInfo,
  order,
}: {
  currencyIn?: Currency | undefined
  currencyOut?: Currency | undefined
  rateInfo?: RateInfo
  order?: LimitOrder
}) => {
  const [invertRate, setInvertRate] = useState(false)
  let symbolIn, symbolOut, rateStr
  if (order) {
    const { makerAssetSymbol, takerAssetSymbol } = order
    symbolIn = takerAssetSymbol
    symbolOut = makerAssetSymbol
    rateStr = formatRateLimitOrder(order, invertRate)
  } else {
    if (!currencyIn || !currencyOut || !rateInfo) return null
    symbolIn = currencyIn?.symbol
    symbolOut = currencyOut?.symbol
    rateStr = formatAmountOrder(invertRate ? rateInfo.invertRate : rateInfo.rate)
  }
  return (
    <Value
      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', maxWidth: 290 }}
      onClick={() => setInvertRate(!invertRate)}
    >
      <Text>
        <Trans>
          {invertRate ? symbolOut : symbolIn} price of {rateStr} {invertRate ? symbolIn : symbolOut}
        </Trans>
      </Text>
      <SwapIcon rotate={90} size={19} />
    </Value>
  )
}
