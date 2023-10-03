import { Plural, t, Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { LoadingRow } from 'components/Loader/styled'
import RouterLabel from 'components/RouterLabel'
import { RowBetween } from 'components/Row'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import useHoverProps from 'hooks/useHoverProps'
import { useIsMobile } from 'nft/hooks'
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { getTransactionCount, isPreviewTrade, isUniswapXTrade } from 'state/routing/utils'
import styled, { DefaultTheme } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { getPriceImpactColor } from 'utils/prices'

import { GasBreakdownTooltip, UniswapXDescription } from './GasBreakdownTooltip'
import SwapRoute from './SwapRoute'

export enum SwapLineItemType {
  EXCHANGE_RATE,
  NETWORK_FEE,
  INPUT_TOKEN_FEE_ON_TRANSFER,
  OUTPUT_TOKEN_FEE_ON_TRANSFER,
  PRICE_IMPACT,
  MAXIMUM_INPUT,
  MINIMUM_OUTPUT,
  EXPECTED_OUTPUT,
  ROUTING_INFO,
}

const DetailRowValue = styled(ThemedText.BodySmall)`
  text-align: right;
  overflow-wrap: break-word;
`
const LabelText = styled(ThemedText.BodySmall)<{ hasTooltip?: boolean }>`
  cursor: ${({ hasTooltip }) => (hasTooltip ? 'help' : 'auto')};
  color: ${({ theme }) => theme.neutral2};
`
const ColorWrapper = styled.span<{ textColor?: keyof DefaultTheme }>`
  ${({ textColor, theme }) => textColor && `color: ${theme[textColor]};`}
`

function FOTTooltipContent() {
  return (
    <>
      <Trans>
        Some tokens take a fee when they are bought or sold, which is set by the token issuer. Uniswap does not receive
        any of these fees.
      </Trans>{' '}
      <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/18673568523789-What-is-a-token-fee-">
        Learn more
      </ExternalLink>
    </>
  )
}

function Loading({ width = 50 }: { width?: number }) {
  return <LoadingRow data-testid="loading-row" height={15} width={width} />
}

function ExchangeRateRow({ trade }: { trade: InterfaceTrade }) {
  const { formatNumber } = useFormatter()
  const rate = `1 ${trade.executionPrice.quoteCurrency.symbol} = ${formatNumber({
    input: parseFloat(trade.executionPrice.toFixed(9)),
    type: NumberType.TokenTx,
  })} ${trade.executionPrice.baseCurrency.symbol}`
  return <>{rate}</>
}

function ColoredPercentRow({ percent }: { percent: Percent }) {
  const { formatPriceImpact } = useFormatter()
  return <ColorWrapper textColor={getPriceImpactColor(percent)}>{formatPriceImpact(percent)}</ColorWrapper>
}

function CurrencyAmountRow({ amount }: { amount: CurrencyAmount<Currency> }) {
  const { formatCurrencyAmount } = useFormatter()
  const formattedAmount = formatCurrencyAmount({ amount, type: NumberType.SwapDetailsAmount })
  return <>{`${formattedAmount} ${amount.currency.symbol}`}</>
}

type LineItemData = {
  Label: React.FC
  Value: React.FC
  TooltipBody?: React.FC
  tooltipSize?: TooltipSize
  loaderWidth?: number
}

function useLineItem(props: SwapLineItemProps): LineItemData | undefined {
  const { trade, syncing, allowedSlippage, type } = props
  const { formatNumber } = useFormatter()

  const isUniswapX = isUniswapXTrade(trade)
  const isPreview = isPreviewTrade(trade)
  const chainId = trade.inputAmount.currency.chainId

  // Tracks the latest submittable trade's fill type, used to 'guess' whether or not to show price impact during preview
  const [lastSubmittableFillType, setLastSubmittableFillType] = useState<TradeFillType>()
  useEffect(() => {
    if (trade.fillType !== TradeFillType.None) setLastSubmittableFillType(trade.fillType)
  }, [trade.fillType])

  switch (type) {
    case SwapLineItemType.EXCHANGE_RATE:
      return {
        Label: () => <Trans>Exchange rate</Trans>,
        Value: () => <ExchangeRateRow trade={trade} />,
      }
    case SwapLineItemType.NETWORK_FEE:
      if (!SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId)) return
      return {
        Label: () => <Plural value={getTransactionCount(trade) || 1} one="Network fee" other="Network fees" />,
        TooltipBody: () => <GasBreakdownTooltip trade={trade} hideUniswapXDescription />,
        Value: () => {
          if (isPreview) return <Loading />
          return <>{formatNumber({ input: trade.totalGasUseEstimateUSD, type: NumberType.FiatGasPrice })}</>
        },
      }
    case SwapLineItemType.PRICE_IMPACT:
      // Hides price impact row if the current trade is UniswapX or we're expecting a preview trade to result in UniswapX
      if (isUniswapX || (isPreview && lastSubmittableFillType === TradeFillType.UniswapX)) return
      return {
        Label: () => <Trans>Price impact</Trans>,
        TooltipBody: () => <Trans>The impact your trade has on the market price of this pool.</Trans>,
        Value: () => (isPreview ? <Loading /> : <ColoredPercentRow percent={trade.priceImpact} />),
      }
    case SwapLineItemType.MAXIMUM_INPUT:
      if (trade.tradeType === TradeType.EXACT_INPUT) return
      return {
        Label: () => <Trans>Maximum input</Trans>,
        TooltipBody: () => (
          <Trans>
            The maximum amount you are guaranteed to spend. If the price slips any further, your transaction will
            revert.
          </Trans>
        ),
        Value: () => <CurrencyAmountRow amount={trade.maximumAmountIn(allowedSlippage)} />,
        loaderWidth: 70,
      }
    case SwapLineItemType.MINIMUM_OUTPUT:
      if (trade.tradeType === TradeType.EXACT_OUTPUT) return
      return {
        Label: () => <Trans>Minimum output</Trans>,
        TooltipBody: () => (
          <Trans>
            The minimum amount you are guaranteed to receive. If the price slips any further, your transaction will
            revert.
          </Trans>
        ),
        Value: () => <CurrencyAmountRow amount={trade.minimumAmountOut(allowedSlippage)} />,
        loaderWidth: 70,
      }
    case SwapLineItemType.EXPECTED_OUTPUT:
      return {
        Label: () => <Trans>Expected output</Trans>,
        TooltipBody: () => (
          <Trans>
            The amount you expect to receive at the current market price. You may receive less or more if the market
            price changes while your transaction is pending.
          </Trans>
        ),
        Value: () => <CurrencyAmountRow amount={trade.postTaxOutputAmount} />,
        loaderWidth: 65,
      }
    case SwapLineItemType.ROUTING_INFO:
      if (isPreview) return { Label: () => <Trans>Order routing</Trans>, Value: () => <Loading /> }
      return {
        Label: () => <Trans>Order routing</Trans>,
        TooltipBody: () => {
          if (isUniswapX) return <UniswapXDescription />
          return <SwapRoute data-testid="swap-route-info" trade={trade} syncing={syncing} />
        },
        tooltipSize: isUniswapX ? TooltipSize.Small : TooltipSize.Large,
        Value: () => <RouterLabel trade={trade} />,
      }
    case SwapLineItemType.INPUT_TOKEN_FEE_ON_TRANSFER:
    case SwapLineItemType.OUTPUT_TOKEN_FEE_ON_TRANSFER:
      return getFOTLineItem(props)
  }
}

function getFOTLineItem({ type, trade }: SwapLineItemProps): LineItemData | undefined {
  const isInput = type === SwapLineItemType.INPUT_TOKEN_FEE_ON_TRANSFER
  const currency = isInput ? trade.inputAmount.currency : trade.outputAmount.currency
  const tax = isInput ? trade.inputTax : trade.outputTax
  if (tax.equalTo(0)) return

  return {
    Label: () => <>{t`${currency.symbol ?? currency.name ?? t`Token`} fee`}</>,
    TooltipBody: FOTTooltipContent,
    Value: () => <ColoredPercentRow percent={tax} />,
  }
}

type ValueWrapperProps = PropsWithChildren<{
  lineItem: LineItemData
  labelHovered: boolean
  syncing: boolean
}>

function ValueWrapper({ children, lineItem, labelHovered, syncing }: ValueWrapperProps) {
  const { TooltipBody, tooltipSize, loaderWidth } = lineItem
  const isMobile = useIsMobile()

  if (syncing) return <Loading width={loaderWidth} />

  if (!TooltipBody) return <DetailRowValue>{children}</DetailRowValue>

  return (
    <MouseoverTooltip
      placement={isMobile ? 'auto' : 'right'}
      forceShow={labelHovered} // displays tooltip when hovering either both label or value
      size={tooltipSize}
      text={
        <ThemedText.Caption color="neutral2">
          <TooltipBody />
        </ThemedText.Caption>
      }
    >
      <DetailRowValue>{children}</DetailRowValue>
    </MouseoverTooltip>
  )
}

interface SwapLineItemProps {
  trade: InterfaceTrade
  syncing: boolean
  allowedSlippage: Percent
  type: SwapLineItemType
}

function SwapLineItem(props: SwapLineItemProps) {
  const [labelHovered, hoverProps] = useHoverProps()

  const LineItem = useLineItem(props)
  if (!LineItem) return null

  return (
    <RowBetween>
      <LabelText {...hoverProps} hasTooltip={!!LineItem.TooltipBody} data-testid="swap-li-label">
        <LineItem.Label />
      </LabelText>
      <ValueWrapper lineItem={LineItem} labelHovered={labelHovered} syncing={props.syncing}>
        <LineItem.Value />
      </ValueWrapper>
    </RowBetween>
  )
}

export default React.memo(SwapLineItem)
