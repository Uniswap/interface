import { t, Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { LoadingRow } from 'components/Loader/styled'
import { ChainLogo } from 'components/Logo/ChainLogo'
import RouterLabel from 'components/RouterLabel'
import Row, { RowBetween } from 'components/Row'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import useHoverProps from 'hooks/useHoverProps'
import { useIsMobile } from 'nft/hooks'
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { animated, SpringValue } from 'react-spring'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { isPreviewTrade, isUniswapXTrade } from 'state/routing/utils'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { SlippageTolerance } from 'state/user/types'
import styled, { DefaultTheme } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { getPriceImpactColor } from 'utils/prices'

import { GasBreakdownTooltip, UniswapXDescription } from './GasBreakdownTooltip'
import { MaxSlippageTooltip } from './MaxSlippageTooltip'
import { RoutingTooltip, SwapRoute } from './SwapRoute'
import TradePrice from './TradePrice'

export enum SwapLineItemType {
  EXCHANGE_RATE,
  NETWORK_COST,
  INPUT_TOKEN_FEE_ON_TRANSFER,
  OUTPUT_TOKEN_FEE_ON_TRANSFER,
  PRICE_IMPACT,
  MAX_SLIPPAGE,
  MAXIMUM_INPUT,
  MINIMUM_OUTPUT,
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

const AutoBadge = styled(ThemedText.LabelMicro).attrs({ fontWeight: 535 })`
  background: ${({ theme }) => theme.surface3};
  border-radius: 8px;
  color: ${({ theme }) => theme.neutral2};
  height: 20px;
  padding: 0 6px;

  ::after {
    content: '${t`Auto`}';
  }
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

function ColoredPercentRow({ percent }: { percent: Percent }) {
  const { formatSlippage } = useFormatter()
  return <ColorWrapper textColor={getPriceImpactColor(percent)}>{formatSlippage(percent)}</ColorWrapper>
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
  const { formatNumber, formatSlippage } = useFormatter()
  const isAutoSlippage = useUserSlippageTolerance()[0] === SlippageTolerance.Auto

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
        Label: () => <Trans>Rate</Trans>,
        Value: () => <TradePrice price={trade.executionPrice} />,
        TooltipBody: !isPreview ? () => <RoutingTooltip trade={trade} /> : undefined,
        tooltipSize: isUniswapX ? TooltipSize.Small : TooltipSize.Large,
      }
    case SwapLineItemType.NETWORK_COST:
      if (!SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId)) return
      return {
        Label: () => <Trans>Network cost</Trans>,
        TooltipBody: () => <GasBreakdownTooltip trade={trade} hideUniswapXDescription />,
        Value: () => {
          if (isPreview) return <Loading />
          return (
            <Row gap="4px">
              <ChainLogo chainId={chainId} />
              {formatNumber({ input: trade.totalGasUseEstimateUSD, type: NumberType.FiatGasPrice })}
            </Row>
          )
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
    case SwapLineItemType.MAX_SLIPPAGE:
      return {
        Label: () => <Trans>Max. slippage</Trans>,
        TooltipBody: () => <MaxSlippageTooltip {...props} />,
        Value: () => (
          <Row gap="8px">
            {isAutoSlippage && <AutoBadge />} {formatSlippage(allowedSlippage)}
          </Row>
        ),
      }
    case SwapLineItemType.MAXIMUM_INPUT:
      if (trade.tradeType === TradeType.EXACT_INPUT) return
      return {
        Label: () => <Trans>Pay at most</Trans>,
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
        Label: () => <Trans>Receive at least</Trans>,
        TooltipBody: () => (
          <Trans>
            The minimum amount you are guaranteed to receive. If the price slips any further, your transaction will
            revert.
          </Trans>
        ),
        Value: () => <CurrencyAmountRow amount={trade.minimumAmountOut(allowedSlippage)} />,
        loaderWidth: 70,
      }
    case SwapLineItemType.ROUTING_INFO:
      if (isPreview || syncing) return { Label: () => <Trans>Order routing</Trans>, Value: () => <Loading /> }
      return {
        Label: () => <Trans>Order routing</Trans>,
        TooltipBody: () => {
          if (isUniswapX) return <UniswapXDescription />
          return <SwapRoute data-testid="swap-route-info" trade={trade} />
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

export interface SwapLineItemProps {
  trade: InterfaceTrade
  syncing: boolean
  allowedSlippage: Percent
  type: SwapLineItemType
  animatedOpacity?: SpringValue<number>
}

function SwapLineItem(props: SwapLineItemProps) {
  const [labelHovered, hoverProps] = useHoverProps()

  const LineItem = useLineItem(props)
  if (!LineItem) return null

  return (
    <animated.div style={{ opacity: props.animatedOpacity }}>
      <RowBetween>
        <LabelText {...hoverProps} hasTooltip={!!LineItem.TooltipBody} data-testid="swap-li-label">
          <LineItem.Label />
        </LabelText>
        <ValueWrapper lineItem={LineItem} labelHovered={labelHovered} syncing={props.syncing}>
          <LineItem.Value />
        </ValueWrapper>
      </RowBetween>
    </animated.div>
  )
}

export default React.memo(SwapLineItem)
