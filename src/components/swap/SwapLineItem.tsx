import { Plural, t, Trans } from '@lingui/macro'
import { Percent, TradeType } from '@uniswap/sdk-core'
import { LoadingRow } from 'components/Loader/styled'
import RouterLabel from 'components/RouterLabel'
import { RowBetween } from 'components/Row'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import useHoverProps from 'hooks/useHoverProps'
import { useIsMobile } from 'nft/hooks'
import React, { PropsWithChildren } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { getTransactionCount, isPreviewTrade, isUniswapXTrade } from 'state/routing/utils'
import styled, { DefaultTheme } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { getPriceImpactColor } from 'utils/prices'

import { GasBreakdownTooltip, UniswapXDescription } from './GasBreakdownTooltip'
import SwapRoute from './SwapRoute'

export enum SwapLineItemTypes {
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

const DetailRowValue = styled(ThemedText.BodySmall)<{ warningColor?: keyof DefaultTheme }>`
  text-align: right;
  overflow-wrap: break-word;
  ${({ warningColor, theme }) => warningColor && `color: ${theme[warningColor]};`};
`
const LabelText = styled(ThemedText.BodySmall)<{ hasTooltip?: boolean }>`
  cursor: ${({ hasTooltip }) => (hasTooltip ? 'help' : 'auto')};
  color: ${({ theme }) => theme.neutral2};
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

type LineItemData = {
  hide?: boolean
  Label: React.FC
  TooltipBody?: React.FC
  tooltipSize?: TooltipSize
  Value: React.FC
  loaderWidth: number
}

function useLineItem(props: SwapLineItemProps): LineItemData {
  const format = useFormatter()

  const { trade, syncing, allowedSlippage, type } = props

  const { formatNumber, formatPriceImpact, formatCurrencyAmount } = format
  const currencyIn = trade.inputAmount.currency
  const currencyOut = trade.outputAmount.currency
  const chainId = currencyIn.chainId

  switch (type) {
    case SwapLineItemTypes.EXCHANGE_RATE:
      return {
        Label: () => <Trans>Exchange rate</Trans>,
        Value: () => (
          <DetailRowValue>{`1 ${trade.executionPrice.quoteCurrency?.symbol} = ${
            formatNumber({
              input: trade.executionPrice ? parseFloat(trade.executionPrice.toFixed(9)) : undefined,
              type: NumberType.TokenTx,
            }) ?? '-'
          } ${trade.executionPrice.baseCurrency?.symbol}`}</DetailRowValue>
        ),
        loaderWidth: 50,
      }
    case SwapLineItemTypes.NETWORK_FEE: {
      const previewItem = {
        hide: !SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId),
        Label: () => <Plural value={getTransactionCount(trade) || 1} one="Network fee" other="Network fees" />,
        Value: () => <LoadingRow height={15} width={50} />,
        loaderWidth: 50,
      }
      if (isPreviewTrade(trade)) return previewItem
      return {
        ...previewItem,
        TooltipBody: () => <GasBreakdownTooltip trade={trade} hideUniswapXDescription />,
        Value: () => (
          <DetailRowValue>
            {formatNumber({ input: trade.totalGasUseEstimateUSD, type: NumberType.FiatGasPrice })}
          </DetailRowValue>
        ),
      }
    }
    case SwapLineItemTypes.PRICE_IMPACT: {
      const previewItem = {
        hide: isUniswapXTrade(trade),
        Label: () => <Trans>Price impact</Trans>,
        Value: () => <LoadingRow height={15} width={50} />,
        loaderWidth: 50,
      }
      if (isPreviewTrade(trade) || isUniswapXTrade(trade)) return previewItem
      return {
        ...previewItem,
        TooltipBody: () => <Trans>The impact your trade has on the market price of this pool.</Trans>,
        Value: () => (
          <DetailRowValue warningColor={getPriceImpactColor(trade.priceImpact)}>
            {formatPriceImpact(trade.priceImpact)}
          </DetailRowValue>
        ),
        loaderWidth: 50,
      }
    }
    case SwapLineItemTypes.INPUT_TOKEN_FEE_ON_TRANSFER:
      return {
        hide: syncing || trade.inputTax.equalTo(0),
        Label: () => <>{t`${currencyIn.symbol ?? currencyIn.name ?? t`Input token`} fee`}</>,
        TooltipBody: FOTTooltipContent,
        Value: () => (
          <DetailRowValue warningColor={getPriceImpactColor(trade.inputTax)}>
            {formatPriceImpact(trade.inputTax)}
          </DetailRowValue>
        ),
        loaderWidth: 50,
      }
    case SwapLineItemTypes.OUTPUT_TOKEN_FEE_ON_TRANSFER:
      return {
        hide: syncing || trade.outputTax.equalTo(0),
        Label: () => <>{t`${currencyOut.symbol ?? currencyOut.name ?? t`Output token`} fee`}</>,
        TooltipBody: FOTTooltipContent,
        Value: () => (
          <DetailRowValue warningColor={getPriceImpactColor(trade.outputTax)}>
            {formatPriceImpact(trade.outputTax)}
          </DetailRowValue>
        ),
        loaderWidth: 50,
      }
    case SwapLineItemTypes.MAXIMUM_INPUT:
      return {
        hide: trade.tradeType === TradeType.EXACT_INPUT,
        Label: () => <Trans>Maximum input</Trans>,
        TooltipBody: () => (
          <Trans>
            The maximum amount you are guaranteed to spend. If the price slips any further, your transaction will
            revert.
          </Trans>
        ),
        Value: () => (
          <DetailRowValue>
            {`${formatCurrencyAmount({
              amount: trade.maximumAmountIn(allowedSlippage),
              type: NumberType.SwapDetailsAmount,
            })} ${trade.inputAmount.currency.symbol}`}
          </DetailRowValue>
        ),
        loaderWidth: 70,
      }
    case SwapLineItemTypes.MINIMUM_OUTPUT:
      return {
        hide: trade.tradeType === TradeType.EXACT_OUTPUT,
        Label: () => <Trans>Minimum output</Trans>,
        TooltipBody: () => (
          <Trans>
            The minimum amount you are guaranteed to receive. If the price slips any further, your transaction will
            revert.
          </Trans>
        ),
        Value: () => (
          <DetailRowValue>
            {`${formatCurrencyAmount({
              amount: trade.minimumAmountOut(allowedSlippage),
              type: NumberType.SwapDetailsAmount,
            })} ${trade.outputAmount.currency.symbol}`}
          </DetailRowValue>
        ),
        loaderWidth: 70,
      }
    case SwapLineItemTypes.EXPECTED_OUTPUT:
      return {
        Label: () => <Trans>Expected output</Trans>,
        TooltipBody: () => (
          <Trans>
            The amount you expect to receive at the current market price. You may receive less or more if the market
            price changes while your transaction is pending.
          </Trans>
        ),
        Value: () => (
          <DetailRowValue>
            {`${formatCurrencyAmount({
              amount: trade.postTaxOutputAmount,
              type: NumberType.SwapDetailsAmount,
            })} ${trade.outputAmount.currency.symbol}`}
          </DetailRowValue>
        ),
        loaderWidth: 65,
      }
    case SwapLineItemTypes.ROUTING_INFO:
      return {
        Label: () => <Trans>Order routing</Trans>,
        TooltipBody: () => {
          if (isPreviewTrade(trade)) return null
          if (isUniswapXTrade(trade)) return <UniswapXDescription />
          return <SwapRoute data-testid="swap-route-info" trade={trade} syncing={syncing} />
        },
        tooltipSize: isUniswapXTrade(trade) ? undefined : TooltipSize.Large,
        Value: () => {
          if (isPreviewTrade(trade)) return <LoadingRow height={15} width={50} />
          return <RouterLabel trade={trade} />
        },
        loaderWidth: 50,
      }
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

  if (syncing) return <LoadingRow data-testid="loading-row" height={15} width={loaderWidth} />

  if (!TooltipBody) return <ThemedText.BodySmall>{children}</ThemedText.BodySmall>

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
      <ThemedText.BodySmall>{children}</ThemedText.BodySmall>
    </MouseoverTooltip>
  )
}

interface SwapLineItemProps {
  trade: InterfaceTrade
  syncing: boolean
  allowedSlippage: Percent
  type: SwapLineItemTypes
}

function SwapLineItem(props: SwapLineItemProps) {
  const [labelHovered, hoverProps] = useHoverProps()

  const LineItem = useLineItem(props)
  if (LineItem.hide) return null

  return (
    <RowBetween>
      <LabelText {...hoverProps} hasTooltip={!!LineItem.TooltipBody}>
        <LineItem.Label />
      </LabelText>
      <ValueWrapper lineItem={LineItem} labelHovered={labelHovered} syncing={props.syncing}>
        <LineItem.Value />
      </ValueWrapper>
    </RowBetween>
  )
}

export default React.memo(SwapLineItem)
