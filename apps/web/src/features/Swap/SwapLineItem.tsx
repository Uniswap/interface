import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  FORMAT_DATE_TIME_MEDIUM,
  useFormattedDateTime,
  useLocalizedDayjs,
} from 'uniswap/src/features/language/localizedDayjs'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { NumberType } from 'utilities/src/format/types'
import { DetailLineItem, LineItemData } from '~/components/DetailLineItem'
import { LoadingRow } from '~/components/Loader/styled'
import { TooltipSize } from '~/components/Tooltip'
import { TradePrice } from '~/components/TradePrice'
import { GasBreakdownTooltip } from '~/features/Swap/GasBreakdownTooltip'
import { GasEstimateTooltip } from '~/features/Swap/GasEstimateTooltip'
import { RoutingTooltip } from '~/features/Swap/SwapRoute'
import { InterfaceTrade, SubmittableTrade } from '~/state/routing/types'
import { isLimitTrade, isPreviewTrade, isUniswapXTrade } from '~/state/routing/utils'
import { ExternalLink } from '~/theme/components/Links'

export enum SwapLineItemType {
  EXCHANGE_RATE = 0,
  NETWORK_COST = 1,
  SWAP_FEE = 6,
  EXPIRY = 9,
}

function BaseTooltipContent({ children, url }: { children: ReactNode; url: string }) {
  const { t } = useTranslation()
  return (
    <>
      {children}
      <br />
      <ExternalLink href={url}>{t('common.button.learn')}</ExternalLink>
    </>
  )
}

export function FOTTooltipContent() {
  const { t } = useTranslation()
  return (
    <BaseTooltipContent url="https://support.uniswap.org/hc/en-us/articles/18673568523789-What-is-a-token-fee-">
      {t('swap.tokenOwnFees')}
    </BaseTooltipContent>
  )
}

function SwapFeeTooltipContent({ hasFee }: { hasFee: boolean }) {
  const { t } = useTranslation()
  const message = hasFee ? t('swap.fees.experience') : t('swap.fees.noFee')
  return (
    <BaseTooltipContent url="https://support.uniswap.org/hc/en-us/articles/20131678274957">
      {message}
    </BaseTooltipContent>
  )
}

export function SlippageTooltipContent() {
  const { t } = useTranslation()
  return (
    <BaseTooltipContent url="https://support.uniswap.org/hc/en-us/articles/20131678274957">
      {t('swap.slippage.tooltip')}
    </BaseTooltipContent>
  )
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
function useLineItem(props: SwapLineItemProps): LineItemData | undefined {
  const { trade, syncing, type } = props
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const localizedDayjs = useLocalizedDayjs()
  const deadline = isLimitTrade(trade) ? trade.deadline : 0
  const formattedDeadline = useFormattedDateTime(localizedDayjs(deadline), FORMAT_DATE_TIME_MEDIUM)

  const isUniswapX = isUniswapXTrade(trade)
  const isPreview = isPreviewTrade(trade)

  switch (type) {
    case SwapLineItemType.EXCHANGE_RATE:
      return {
        Label: () => (isLimitTrade(trade) ? t('limits.price.label') : t('common.rate')),
        Value: () => <TradePrice price={trade.executionPrice} />,
        TooltipBody: !isPreview ? () => <RoutingTooltip trade={trade} /> : undefined,
        tooltipSize: isUniswapX ? TooltipSize.Small : TooltipSize.Large,
      }
    case SwapLineItemType.NETWORK_COST:
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
    case SwapLineItemType.SWAP_FEE: {
      if (isPreview) {
        return { Label: () => t('common.fee'), Value: () => <Loading /> }
      }
      return {
        Label: () => (
          <>
            {t('common.fee')} {trade.swapFee && `(${formatPercent(trade.swapFee.percent.toSignificant())})`}
          </>
        ),
        TooltipBody: () => <SwapFeeTooltipContent hasFee={Boolean(trade.swapFee)} />,
        Value: () => <FeeRow trade={trade} />,
      }
    }
    case SwapLineItemType.EXPIRY:
      if (!isLimitTrade(trade) || !formattedDeadline) {
        return undefined
      }
      return {
        Label: () => t('common.expiry'),
        Value: () => <Text variant="body2">{formattedDeadline}</Text>,
      }
  }
}

interface SwapLineItemProps {
  trade: InterfaceTrade
  syncing?: boolean
  type: SwapLineItemType
  visible?: boolean
  animationDelay?: number
}

function SwapLineItemInner(props: SwapLineItemProps) {
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

export const SwapLineItem = React.memo(SwapLineItemInner)
