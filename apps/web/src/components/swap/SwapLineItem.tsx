import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import Row from 'components/deprecated/Row'
import { LoadingRow } from 'components/Loader/styled'
import { DetailLineItem, LineItemData } from 'components/swap/DetailLineItem'
import { GasBreakdownTooltip } from 'components/swap/GasBreakdownTooltip'
import GasEstimateTooltip from 'components/swap/GasEstimateTooltip'
import { RoutingTooltip } from 'components/swap/SwapRoute'
import TradePrice from 'components/swap/TradePrice'
import { TooltipSize } from 'components/Tooltip'
import { useUSDPrice } from 'hooks/useUSDPrice'
import React, { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { InterfaceTrade, SubmittableTrade } from 'state/routing/types'
import { isLimitTrade, isPreviewTrade, isUniswapXTrade } from 'state/routing/utils'
import { ExternalLink } from 'theme/components/Links'
import { Flex } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export enum SwapLineItemType {
  EXCHANGE_RATE = 0,
  NETWORK_COST = 1,
  SWAP_FEE = 6,
  EXPIRY = 9,
}

function BaseTooltipContent({ children, url }: { children: ReactNode; url: string }) {
  return (
    <>
      {children}
      <br />
      <ExternalLink href={url}>
        <Trans i18nKey="common.button.learn" />
      </ExternalLink>
    </>
  )
}

export function FOTTooltipContent() {
  return (
    <BaseTooltipContent url="https://support.uniswap.org/hc/en-us/articles/18673568523789-What-is-a-token-fee-">
      <Trans i18nKey="swap.tokenOwnFees" />
    </BaseTooltipContent>
  )
}

function SwapFeeTooltipContent({ hasFee }: { hasFee: boolean }) {
  const message = hasFee ? <Trans i18nKey="swap.fees.experience" /> : <Trans i18nKey="swap.fees.noFee" />
  return (
    <BaseTooltipContent url="https://support.uniswap.org/hc/en-us/articles/20131678274957">
      {message}
    </BaseTooltipContent>
  )
}

export function SlippageTooltipContent() {
  return (
    <BaseTooltipContent url="https://support.uniswap.org/hc/en-us/articles/20131678274957">
      <Trans i18nKey="swap.slippage.tooltip" />
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
  const { data: outputFeeFiatValue } = useUSDPrice(feeCurrencyAmount, feeCurrencyAmount.currency)

  // Fallback to displaying token amount if fiat value is not available
  if (outputFeeFiatValue === undefined) {
    return <CurrencyAmountRow amount={feeCurrencyAmount} />
  }

  return <>{convertFiatAmountFormatted(outputFeeFiatValue, NumberType.FiatGasPrice)}</>
}

// eslint-disable-next-line consistent-return
function useLineItem(props: SwapLineItemProps): LineItemData | undefined {
  const { trade, syncing, type } = props
  const { formatPercent } = useLocalizationContext()

  const isUniswapX = isUniswapXTrade(trade)
  const isPreview = isPreviewTrade(trade)

  switch (type) {
    case SwapLineItemType.EXCHANGE_RATE:
      return {
        Label: () => (isLimitTrade(trade) ? <Trans i18nKey="limits.price.label" /> : <Trans i18nKey="common.rate" />),
        Value: () => <TradePrice price={trade.executionPrice} />,
        TooltipBody: !isPreview ? () => <RoutingTooltip trade={trade} /> : undefined,
        tooltipSize: isUniswapX ? TooltipSize.Small : TooltipSize.Large,
      }
    case SwapLineItemType.NETWORK_COST:
      return {
        Label: () => <Trans i18nKey="common.networkCost" />,
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
        return { Label: () => <Trans i18nKey="common.fee" />, Value: () => <Loading /> }
      }
      return {
        Label: () => (
          <>
            <Trans i18nKey="common.fee" />{' '}
            {trade.swapFee && `(${formatPercent(trade.swapFee.percent.toSignificant())})`}
          </>
        ),
        TooltipBody: () => <SwapFeeTooltipContent hasFee={Boolean(trade.swapFee)} />,
        Value: () => <FeeRow trade={trade} />,
      }
    }
    case SwapLineItemType.EXPIRY:
      if (!isLimitTrade(trade)) {
        return undefined
      }
      return {
        Label: () => <Trans i18nKey="common.expiry" />,
        Value: () => <Row>{formatTimestamp({ timestamp: trade.deadline, includeYear: true })}</Row>,
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

function SwapLineItem(props: SwapLineItemProps) {
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

export default React.memo(SwapLineItem)
