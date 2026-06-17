import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  FORMAT_DATE_TIME_MEDIUM,
  useFormattedDateTime,
  useLocalizedDayjs,
} from 'uniswap/src/features/language/localizedDayjs'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'
import { DetailLineItem, LineItemData } from '~/components/DetailLineItem'
import { LoadingRow } from '~/components/Loader/styled'
import { TooltipSize } from '~/components/Tooltip'
import { TradePrice } from '~/components/TradePrice'
import { SwapFeeTooltipContent } from '~/features/Swap/SwapLineItemTooltips'
import { GasBreakdownTooltip } from '~/pages/Swap/Limit/GasBreakdownTooltip'
import { GasEstimateTooltip } from '~/pages/Swap/Limit/GasEstimateTooltip'
import { RoutingTooltip } from '~/pages/Swap/Limit/LimitOrderRoute'
import { InterfaceTrade, SubmittableTrade } from '~/state/routing/types'
import { isLimitTrade, isPreviewTrade, isUniswapXTrade } from '~/state/routing/utils'

export enum LimitOrderLineItemType {
  EXCHANGE_RATE = 0,
  NETWORK_COST = 1,
  SWAP_FEE = 6,
  EXPIRY = 9,
}

function Loading({ width = 50 }: { width?: number }) {
  return <LoadingRow data-testid="loading-row" height={15} width={width} />
}

function CurrencyAmountRow({ amount }: { amount: CurrencyAmount<Currency> }) {
  const { formatCurrencyAmount } = useLocalizationContext()
  const formattedAmount = formatCurrencyAmount({ value: amount, type: NumberType.SwapTradeAmount })
  return <>{`${formattedAmount} ${amount.currency.symbol}`}</>
}

function FeeRow({ trade: { swapFee, outputAmount } }: { trade: SubmittableTrade }) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const feeCurrencyAmount = CurrencyAmount.fromRawAmount(outputAmount.currency, swapFee?.amount ?? 0)
  const outputFeeFiatValue = useUSDCValue(feeCurrencyAmount)

  // Fallback to displaying token amount if fiat value is not available
  if (!outputFeeFiatValue) {
    return <CurrencyAmountRow amount={feeCurrencyAmount} />
  }

  return <>{convertFiatAmountFormatted(outputFeeFiatValue.toExact(), NumberType.FiatGasPrice)}</>
}

// oxlint-disable-next-line typescript/consistent-return
function useLineItem(props: LimitOrderLineItemProps): LineItemData | undefined {
  const { trade, syncing, type } = props
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const localizedDayjs = useLocalizedDayjs()
  const deadline = isLimitTrade(trade) ? trade.deadline : 0
  const formattedDeadline = useFormattedDateTime(localizedDayjs(deadline), FORMAT_DATE_TIME_MEDIUM)

  const isUniswapX = isUniswapXTrade(trade)
  const isPreview = isPreviewTrade(trade)

  switch (type) {
    case LimitOrderLineItemType.EXCHANGE_RATE:
      return {
        Label: () => (isLimitTrade(trade) ? t('limits.price.label') : t('common.rate')),
        Value: () => <TradePrice price={trade.executionPrice} />,
        TooltipBody: !isPreview ? () => <RoutingTooltip trade={trade} /> : undefined,
        tooltipSize: isUniswapX ? TooltipSize.Small : TooltipSize.Large,
      }
    case LimitOrderLineItemType.NETWORK_COST:
      return {
        Label: () => t('common.networkCost'),
        TooltipBody: () => <GasBreakdownTooltip trade={trade} />,
        Value: () => {
          if (isPreview) {
            return <Loading />
          }
          return <GasEstimateTooltip trade={trade} loading={!!syncing} />
        },
      }
    case LimitOrderLineItemType.SWAP_FEE: {
      if (isPreview) {
        return { Label: () => t('common.fee'), Value: () => <Loading /> }
      }
      return {
        Label: () => (
          <>
            {t('common.fee')} {trade.swapFee && `(${formatPercent(trade.swapFee.percent.toSignificant(), 2)})`}
          </>
        ),
        TooltipBody: () => <SwapFeeTooltipContent hasFee={Boolean(trade.swapFee)} />,
        Value: () => <FeeRow trade={trade} />,
      }
    }
    case LimitOrderLineItemType.EXPIRY:
      if (!isLimitTrade(trade) || !formattedDeadline) {
        return undefined
      }
      return {
        Label: () => t('common.expiry'),
        Value: () => <Text variant="body2">{formattedDeadline}</Text>,
      }
  }
}

interface LimitOrderLineItemProps {
  trade: InterfaceTrade
  syncing?: boolean
  type: LimitOrderLineItemType
  visible?: boolean
  animationDelay?: number
}

function LimitOrderLineItemInner(props: LimitOrderLineItemProps) {
  const { visible = true, animationDelay, syncing } = props
  const LineItem = useLineItem(props)
  if (!LineItem) {
    return null
  }

  return (
    <Flex
      opacity={visible ? 1 : 0}
      animation={{
        opacity: {
          type: 'quick',
          delay: animationDelay,
        },
      }}
    >
      <DetailLineItem LineItem={LineItem} syncing={syncing} />
    </Flex>
  )
}

export const LimitOrderLineItem = React.memo(LimitOrderLineItemInner)
