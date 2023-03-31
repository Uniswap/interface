import { Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties, DefaultTheme } from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import Logo from 'components/Logo'
import ProgressBar from 'components/ProgressBar'
import { checkOrderActive } from 'components/swapv2/LimitOrder/ListOrder'
import useTheme from 'hooks/useTheme'
import { useTokenBalance } from 'state/wallet/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { toCurrencyAmount } from 'utils/currencyAmount'

import { calcPercentFilledOrder, formatAmountOrder, formatRateLimitOrder } from '../helpers'
import { LimitOrder, LimitOrderStatus } from '../type'
import ActionButtons from './ActionButtons'

export const ItemWrapper = styled.div<{ hasBorder?: boolean }>`
  border-bottom: 1px solid ${({ theme, hasBorder }) => (hasBorder ? theme.border : 'transparent')};
  font-size: 12px;
  padding: 10px;
  grid-template-columns: 1.5fr 1fr 1.5fr 2fr 80px;
  display: grid;
  gap: 10px;
  align-items: center;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1.5fr 1.5fr 1.5fr 80px;
    .rate {
      display:none;
    }
  `}
`

const ItemWrapperMobile = styled.div`
  display: flex;
  font-size: 12px;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  padding: 20px 0px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`
const DeltaAmount = styled.div<{ color: string }>`
  font-weight: 500;
  color: ${({ color }) => color};
`
const Colum = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px 12px;
  justify-content: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
      gap: 5px 12px;
  `}
`

const TimeText = ({ time, style = {} }: { time: number; style?: CSSProperties }) => {
  const theme = useTheme()
  return (
    <Flex fontWeight={'500'} color={theme.subText} style={style}>
      <Text>{dayjs(time * 1000).format('DD/MM/YYYY')}</Text>
      &nbsp; <Text>{dayjs(time * 1000).format('HH:mm')}</Text>
    </Flex>
  )
}

const LOGO_SIZE = '17px'
const TokenLogo = styled(Logo)`
  width: ${LOGO_SIZE};
  height: ${LOGO_SIZE};
  border-radius: 100%;
  margin-right: 8px;
`

const SingleAmountInfo = ({
  amount,
  color,
  logoUrl,
  symbol,
  plus = true,
  hideLogo = false,
  decimals,
}: {
  amount: string
  color: string
  symbol: string
  logoUrl: string
  plus?: boolean
  hideLogo?: boolean
  decimals: number
}) => (
  <Flex alignItems={'center'}>
    {!hideLogo && <TokenLogo srcs={[logoUrl]} />}
    <DeltaAmount color={color}>
      {plus ? '+' : '-'} {formatAmountOrder(amount, decimals)} {symbol || '???'}
    </DeltaAmount>
  </Flex>
)
const AmountInfo = ({ order }: { order: LimitOrder }) => {
  const {
    makerAssetSymbol,
    makerAssetLogoURL,
    takerAssetLogoURL,
    takerAssetSymbol,
    makingAmount,
    takingAmount,
    makerAssetDecimals,
    takerAssetDecimals,
  } = order
  const theme = useTheme()
  return (
    <Colum>
      <SingleAmountInfo
        decimals={takerAssetDecimals}
        color={theme.primary}
        logoUrl={takerAssetLogoURL}
        amount={takingAmount}
        symbol={takerAssetSymbol}
      />
      <SingleAmountInfo
        decimals={makerAssetDecimals}
        plus={false}
        color={theme.border}
        logoUrl={makerAssetLogoURL}
        amount={makingAmount}
        symbol={makerAssetSymbol}
      />
    </Colum>
  )
}

const TradeRateOrder = ({ order, style = {} }: { order: LimitOrder; style?: CSSProperties }) => {
  const [invert, setInvert] = useState(false)
  const theme = useTheme()
  const symbolIn = order.makerAssetSymbol || '???'
  const symbolOut = order.takerAssetSymbol || '???'
  return (
    <Colum style={style}>
      <Flex style={{ gap: 6, cursor: 'pointer', alignItems: 'center' }} onClick={() => setInvert(!invert)}>
        <Text color={theme.subText}>{!invert ? `${symbolOut}/${symbolIn}` : `${symbolIn}/${symbolOut}`}</Text>
        <Repeat color={theme.subText} size={12} />
      </Flex>
      <Text color={theme.text}>{formatRateLimitOrder(order, invert)}</Text>
    </Colum>
  )
}

function formatStatus(status: string) {
  status = status.replace('_', ' ')
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function getNeededMakingAmount(order: LimitOrder) {
  const makingToken = new Token(order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol, '')
  const makingAmount = toCurrencyAmount(makingToken, order.makingAmount)
  const filledMakingAmount = toCurrencyAmount(makingToken, order.filledMakingAmount)

  return makingAmount.subtract(filledMakingAmount)
}

function formatStatusLimitOrder(order: LimitOrder, isCancelling = false, isNotSufficientFund = false) {
  const { takingAmount, filledTakingAmount, takerAssetDecimals } = order
  const filledPercent = calcPercentFilledOrder(filledTakingAmount, takingAmount, takerAssetDecimals)
  const status = isCancelling ? LimitOrderStatus.CANCELLING : order.status
  const partiallyFilled = status === LimitOrderStatus.PARTIALLY_FILLED
  const expandTitle = [LimitOrderStatus.EXPIRED, LimitOrderStatus.CANCELLED, LimitOrderStatus.CANCELLING].includes(
    status,
  )
    ? ` | ${formatStatus(status)}`
    : isNotSufficientFund && status !== LimitOrderStatus.FILLED
    ? `, ${t`insufficient funds`}`
    : ''
  return `${partiallyFilled ? t`Partially Filled` : t`Filled`} ${filledPercent}%${expandTitle}`
}

const getColorStatus = (status: LimitOrderStatus, theme: DefaultTheme, isNotSufficientFund = false) => {
  const MapStatusColor: { [key: string]: string } = {
    [LimitOrderStatus.FILLED]: theme.primary,
    [LimitOrderStatus.CANCELLED]: theme.red,
    [LimitOrderStatus.CANCELLING]: theme.red,
    [LimitOrderStatus.EXPIRED]: theme.warning,
    [LimitOrderStatus.PARTIALLY_FILLED]: theme.warning,
  }

  const color = MapStatusColor[status]
  if (color) {
    return color
  }

  if (isNotSufficientFund) {
    return theme.warning
  }

  return undefined
}
const IndexText = styled.div`
  width: 18px;
  text-align: centẻ;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
`

const WarningText = styled.span`
  color: ${({ theme }) => theme.warning};
`

export default function OrderItem({
  order,
  index,
  onCancelOrder,
  onEditOrder,
  isOrderCancelling,
  tokenPrices,
}: {
  order: LimitOrder
  onCancelOrder: (order: LimitOrder) => void
  onEditOrder: (order: LimitOrder) => void
  index: number
  isOrderCancelling: (order: LimitOrder) => boolean
  tokenPrices: Record<string, number>
}) {
  const [expand, setExpand] = useState(false)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const isCancelling = isOrderCancelling(order)

  const {
    createdAt = Date.now(),
    expiredAt = Date.now(),
    takingAmount,
    filledTakingAmount,
    transactions = [],
    takerAssetSymbol,
    makerAssetDecimals,
    takerAssetDecimals,
  } = order
  const status = isCancelling ? LimitOrderStatus.CANCELLING : order.status
  const isOrderActive = checkOrderActive(order)
  const filledPercent = calcPercentFilledOrder(filledTakingAmount, takingAmount, takerAssetDecimals)
  const theme = useTheme()

  const makingToken = useMemo(() => {
    return new Token(order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol, '')
  }, [order.chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol])

  const makingTokenBalance = useTokenBalance(makingToken)
  const neededFund = getNeededMakingAmount(order)
  const isNotSufficientFund = makingTokenBalance ? makingTokenBalance.lessThan(neededFund) : false

  const colorStatus = getColorStatus(status, theme, isNotSufficientFund)
  const txHash = transactions[0]?.txHash ?? ''
  const toggle = () => setExpand(prev => !prev)

  const marketPrice = tokenPrices[order.takerAsset] / tokenPrices[order.makerAsset]
  const selectedPrice = Number(formatRateLimitOrder(order, false))
  const percent = ((marketPrice - selectedPrice) / marketPrice) * 100

  const renderProgressComponent = () => {
    const getTooltipText = () => {
      const texts = [<Trans key={0}>Insufficient {order.makerAssetSymbol} balance for order execution.</Trans>]

      if (Number.isFinite(percent) && percent < 0) {
        texts.push(<> </>)
        texts.push(
          <Trans key={1}>
            Once you add {order.makerAssetSymbol}, the order will be executed at{' '}
            <WarningText>{percent.toFixed(2)}%</WarningText> below the market price.
          </Trans>,
        )
      }

      return texts
    }

    return (
      <Colum>
        <Flex
          alignItems="center"
          color={colorStatus}
          sx={{
            gap: '4px',
          }}
        >
          {isOrderActive && isNotSufficientFund && (
            <InfoHelper
              style={{
                marginLeft: 0,
              }}
              placement="top"
              color={colorStatus}
              text={getTooltipText()}
            />
          )}{' '}
          {formatStatusLimitOrder(order, isCancelling, isNotSufficientFund)}
        </Flex>
        <ProgressBar
          width={upToSmall ? '160px' : 'unset'}
          backgroundColor={theme.subText}
          color={colorStatus}
          height="11px"
          percent={isNaN(parseFloat(filledPercent)) ? 0 : parseFloat(filledPercent)}
        />
      </Colum>
    )
  }

  if (upToSmall) {
    return (
      <ItemWrapperMobile>
        <Flex justifyContent={'space-between'}>
          <AmountInfo order={order} />
          <ActionButtons
            order={order}
            txHash={txHash}
            onExpand={toggle}
            expand={expand}
            onCancelOrder={onCancelOrder}
            onEditOrder={onEditOrder}
            isCancelling={isCancelling}
          />
        </Flex>
        <Flex justifyContent={'space-between'}>
          {renderProgressComponent()}
          <TradeRateOrder order={order} style={{ textAlign: 'right' }} />
        </Flex>
        {expand && (
          <div>
            {transactions.map(txs => {
              return (
                <Flex key={txs.txHash} style={{ justifyContent: 'space-between' }}>
                  <SingleAmountInfo
                    decimals={makerAssetDecimals}
                    color={theme.subText}
                    logoUrl={order.takerAssetLogoURL}
                    amount={txs.takingAmount}
                    symbol={takerAssetSymbol}
                    hideLogo
                  />
                  <Flex alignItems={'center'}>
                    <TimeText time={txs.txTime} style={{ marginRight: '7px' }} />
                    <ActionButtons itemStyle={{ margin: 0 }} order={order} txHash={txHash} isChildren />
                  </Flex>
                </Flex>
              )
            })}
          </div>
        )}
        <Flex justifyContent={'space-between'}>
          <Colum>
            <Text>
              <Trans>Created</Trans>
            </Text>
            <TimeText time={createdAt} />
          </Colum>
          <Colum>
            <Text textAlign={'right'}>
              <Trans>Expiry</Trans>
            </Text>
            <TimeText time={order.expiredAt} />
          </Colum>
        </Flex>
      </ItemWrapperMobile>
    )
  }
  return (
    <>
      <ItemWrapper hasBorder={!transactions.length || !expand}>
        <Flex alignItems={'center'} style={{ gap: 10 }}>
          <IndexText>{index + 1}</IndexText>
          <AmountInfo order={order} />
        </Flex>
        <Colum className="rate">
          <TradeRateOrder order={order} />
        </Colum>
        <Colum>
          <TimeText time={createdAt} />
          <TimeText time={expiredAt} />
        </Colum>
        <Colum>{renderProgressComponent()}</Colum>
        <ActionButtons
          order={order}
          onExpand={toggle}
          expand={expand}
          txHash={txHash}
          onCancelOrder={onCancelOrder}
          onEditOrder={onEditOrder}
          isCancelling={isCancelling}
        />
      </ItemWrapper>
      {expand && (
        <Flex flexDirection="column" style={{ paddingBottom: 10, borderBottom: `1px solid ${theme.border}` }}>
          {transactions.map((txs, i) => {
            const filledPercent = calcPercentFilledOrder(txs.takingAmount, takingAmount, takerAssetDecimals)
            return (
              <ItemWrapper key={txs.txHash} hasBorder={false} style={{ paddingTop: 0, paddingBottom: 0 }}>
                <Flex alignItems={'center'} style={{ gap: 10 }}>
                  <IndexText />
                  <Flex>
                    <div style={{ width: LOGO_SIZE, marginRight: 8 }} />
                    <DeltaAmount color={theme.subText}>
                      + {formatAmountOrder(txs.takingAmount, takerAssetDecimals)} {takerAssetSymbol}
                    </DeltaAmount>
                  </Flex>
                </Flex>
                <Colum className="rate"></Colum>
                <Colum>
                  <TimeText time={txs.txTime} />
                </Colum>
                <Colum>
                  <Text color={colorStatus}>{filledPercent}%</Text>
                </Colum>
                <ActionButtons order={order} txHash={txs.txHash} isChildren />
              </ItemWrapper>
            )
          })}
        </Flex>
      )}
    </>
  )
}
