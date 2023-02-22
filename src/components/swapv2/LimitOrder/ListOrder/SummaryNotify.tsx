import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { ReactNode } from 'react'
import { Text } from 'rebass'

import useTheme from 'hooks/useTheme'

import { calcPercentFilledOrder, calcRate, formatAmountOrder, formatRateLimitOrder } from '../helpers'
import { LimitOrder, LimitOrderStatus } from '../type'

export default function SummaryNotify({
  type,
  message,
  orders = [],
}: {
  type?: LimitOrderStatus
  message?: string
  orders?: LimitOrder[]
}) {
  const isMultiOrder = orders.length > 1
  const order = orders[0]
  const {
    makingAmount,
    makerAssetSymbol,
    takingAmount,
    takerAssetSymbol,
    filledTakingAmount,
    makerAssetDecimals,
    takerAssetDecimals,
  } = order || ({} as LimitOrder)
  const theme = useTheme()
  const rate = order ? formatRateLimitOrder(order, false) : ''
  const filledPercent = order ? calcPercentFilledOrder(filledTakingAmount, takingAmount, takerAssetDecimals) : 0
  const mainMsg = order ? (
    <Trans>
      <Text as="span" fontWeight={500}>
        {formatAmountOrder(makingAmount, makerAssetDecimals)} {makerAssetSymbol}
      </Text>{' '}
      and receive{' '}
      <Text as="span" fontWeight={500}>
        {formatAmountOrder(takingAmount, takerAssetDecimals)} {takerAssetSymbol}
      </Text>{' '}
      <Text as="span" color={theme.subText}>
        at {takerAssetSymbol} price of {rate} {makerAssetSymbol}
      </Text>
    </Trans>
  ) : null

  let msg: ReactNode
  const listOrderName = (
    <ul
      style={{
        padding: '5px 0px 0px 15px',
        margin: '0',
      }}
    >
      {orders.map(order => (
        <li key={order.id}>
          {t`${formatAmountOrder(order.makingAmount, order.makerAssetDecimals)} ${
            order.makerAssetSymbol
          } to ${formatAmountOrder(order.takingAmount, order.takerAssetDecimals)} ${order.takerAssetSymbol}`}
        </li>
      ))}
    </ul>
  )

  const filledComponent =
    filledPercent && parseFloat(filledPercent) !== 0 ? (
      <>
        <br />
        <Trans>Your order was {filledPercent}% filled</Trans>
      </>
    ) : null

  switch (type) {
    case LimitOrderStatus.CANCELLED:
      if (isMultiOrder)
        msg = (
          <Trans>
            Your orders below have successfully cancelled:
            <br />
            {listOrderName}
          </Trans>
        )
      else
        msg = (
          <Trans>
            You have successfully cancelled an order to pay {mainMsg}
            {filledComponent}
          </Trans>
        )
      break
    case LimitOrderStatus.CANCELLED_FAILED:
      if (isMultiOrder)
        msg = (
          <Trans>
            Your orders below cancel failed:
            <br />
            {listOrderName}
          </Trans>
        )
      else msg = <Trans>Cancel order to pay {mainMsg} failed</Trans>
      break
    case LimitOrderStatus.FILLED:
      if (isMultiOrder)
        msg = (
          <Trans>
            Your orders below was successfully filled:
            <br />
            {listOrderName}
          </Trans>
        )
      else msg = <Trans>Your order to pay {mainMsg} was successfully filled</Trans>
      break
    case LimitOrderStatus.PARTIALLY_FILLED:
      msg = (
        <Trans>
          Your order to pay {mainMsg} is {filledPercent}% filled
        </Trans>
      )
      break
    case LimitOrderStatus.EXPIRED:
      if (isMultiOrder)
        msg = (
          <Trans>
            Your orders below has expired:
            <br />
            {listOrderName}
          </Trans>
        )
      else
        msg = (
          <Trans>
            Your order to pay {mainMsg} has expired
            {filledComponent}
          </Trans>
        )
      break
  }

  return (
    <Text color={theme.text} lineHeight="18px">
      {message || msg}
    </Text>
  )
}

export const SummaryNotifyOrderPlaced = ({
  currencyIn,
  currencyOut,
  inputAmount,
  outputAmount,
}: {
  currencyIn: Currency
  currencyOut: Currency
  inputAmount: string
  outputAmount: string
}) => {
  const theme = useTheme()
  return (
    <Text color={theme.text} lineHeight="18px">
      <Trans>
        You have successfully placed an order to pay{' '}
        <Text as="span" fontWeight={500}>
          {formatAmountOrder(inputAmount)} {currencyIn.symbol}
        </Text>{' '}
        and receive{' '}
        <Text as="span" fontWeight={500}>
          {formatAmountOrder(outputAmount)} {currencyOut.symbol}{' '}
        </Text>
        <Text as="span" color={theme.subText}>
          at {currencyIn.symbol} price of {calcRate(inputAmount, outputAmount, currencyOut.decimals)}{' '}
          {currencyOut.symbol}.
        </Text>
      </Trans>
    </Text>
  )
}
