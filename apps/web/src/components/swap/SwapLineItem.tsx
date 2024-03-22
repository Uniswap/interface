import { t, Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import { LoadingRow } from 'components/Loader/styled'
import RouterLabel from 'components/RouterLabel'
import Row from 'components/Row'
import { TooltipSize } from 'components/Tooltip'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import { useUSDPrice } from 'hooks/useUSDPrice'
import React, { useEffect, useState } from 'react'
import { animated, SpringValue } from 'react-spring'
import { InterfaceTrade, SubmittableTrade, TradeFillType } from 'state/routing/types'
import { isLimitTrade, isPreviewTrade, isUniswapXTrade } from 'state/routing/utils'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { SlippageTolerance } from 'state/user/types'
import styled, { DefaultTheme } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { getPriceImpactColor } from 'utils/prices'

import { DetailLineItem, LineItemData } from './DetailLineItem'
import { GasBreakdownTooltip, UniswapXDescription } from './GasBreakdownTooltip'
import GasEstimateTooltip from './GasEstimateTooltip'
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
  SWAP_FEE,
  MAXIMUM_INPUT,
  MINIMUM_OUTPUT,
  ROUTING_INFO,
  EXPIRY,
}

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

export function FOTTooltipContent() {
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

function SwapFeeTooltipContent({ hasFee }: { hasFee: boolean }) {
  const message = hasFee ? (
    <Trans>
      This fee is applied on select token pairs to ensure the best experience with Uniswap. It is paid in the output
      token and has already been factored into the quote.
    </Trans>
  ) : (
    <Trans>
      This fee is applied on select token pairs to ensure the best experience with Uniswap. There is no fee associated
      with this swap.
    </Trans>
  )
  return (
    <>
      {message}{' '}
      <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/20131678274957">
        <Trans>Learn more</Trans>
      </ExternalLink>
    </>
  )
}

function Loading({ width = 50 }: { width?: number }) {
  return <LoadingRow data-testid="loading-row" height={15} width={width} />
}

function ColoredPercentRow({ percent, estimate }: { percent: Percent; estimate?: boolean }) {
  const { formatPercent } = useFormatter()
  const formattedPercent = (estimate ? '~' : '') + formatPercent(percent)
  return <ColorWrapper textColor={getPriceImpactColor(percent)}>{formattedPercent}</ColorWrapper>
}

function CurrencyAmountRow({ amount }: { amount: CurrencyAmount<Currency> }) {
  const { formatCurrencyAmount } = useFormatter()
  const formattedAmount = formatCurrencyAmount({ amount, type: NumberType.SwapDetailsAmount })
  return <>{`${formattedAmount} ${amount.currency.symbol}`}</>
}

function FeeRow({ trade: { swapFee, outputAmount } }: { trade: SubmittableTrade }) {
  const { formatNumber } = useFormatter()

  const feeCurrencyAmount = CurrencyAmount.fromRawAmount(outputAmount.currency, swapFee?.amount ?? 0)
  const { data: outputFeeFiatValue } = useUSDPrice(feeCurrencyAmount, feeCurrencyAmount?.currency)

  // Fallback to displaying token amount if fiat value is not available
  if (outputFeeFiatValue === undefined) return <CurrencyAmountRow amount={feeCurrencyAmount} />

  return <>{formatNumber({ input: outputFeeFiatValue, type: NumberType.FiatGasPrice })}</>
}

function useLineItem(props: SwapLineItemProps): LineItemData | undefined {
  const { trade, syncing, allowedSlippage, type } = props
  const { formatPercent } = useFormatter()
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
        Label: () => (isLimitTrade(trade) ? <Trans>Limit price</Trans> : <Trans>Rate</Trans>),
        Value: () => <TradePrice price={trade.executionPrice} />,
        TooltipBody: !isPreview ? () => <RoutingTooltip trade={trade} /> : undefined,
        tooltipSize: isUniswapX ? TooltipSize.Small : TooltipSize.Large,
      }
    case SwapLineItemType.NETWORK_COST:
      if (!SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId)) return
      return {
        Label: () => <Trans>Network cost</Trans>,
        TooltipBody: () => <GasBreakdownTooltip trade={trade} />,
        Value: () => {
          if (isPreview) return <Loading />
          return <GasEstimateTooltip trade={trade} loading={!!syncing} />
        },
      }
    case SwapLineItemType.PRICE_IMPACT:
      // Hides price impact row if the current trade is UniswapX or we're expecting a preview trade to result in UniswapX
      if (isUniswapX || (isPreview && lastSubmittableFillType === TradeFillType.UniswapX)) return
      return {
        Label: () => <Trans>Price impact</Trans>,
        TooltipBody: () => <Trans>The impact your trade has on the market price of this pool.</Trans>,
        Value: () => (isPreview ? <Loading /> : <ColoredPercentRow percent={trade.priceImpact} estimate />),
      }
    case SwapLineItemType.MAX_SLIPPAGE:
      return {
        Label: () => <Trans>Max. slippage</Trans>,
        TooltipBody: () => <MaxSlippageTooltip trade={trade} allowedSlippage={allowedSlippage ?? new Percent(0)} />,
        Value: () => (
          <Row gap="8px">
            {isAutoSlippage && <AutoBadge />} {formatPercent(allowedSlippage)}
          </Row>
        ),
      }
    case SwapLineItemType.SWAP_FEE: {
      if (isPreview) return { Label: () => <Trans>Fee</Trans>, Value: () => <Loading /> }
      return {
        Label: () => (
          <>
            <Trans>Fee</Trans> {trade.swapFee && `(${formatPercent(trade.swapFee.percent)})`}
          </>
        ),
        TooltipBody: () => <SwapFeeTooltipContent hasFee={Boolean(trade.swapFee)} />,
        Value: () => <FeeRow trade={trade} />,
      }
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
        Value: () => <CurrencyAmountRow amount={trade.maximumAmountIn(allowedSlippage ?? new Percent(0))} />,
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
        Value: () => <CurrencyAmountRow amount={trade.minimumAmountOut(allowedSlippage ?? new Percent(0))} />,
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
    case SwapLineItemType.EXPIRY:
      if (!isLimitTrade(trade)) return
      return {
        Label: () => <Trans>Expiry</Trans>,
        Value: () => <Row>{formatTimestamp(trade.deadline, true)}</Row>,
      }
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

export interface SwapLineItemProps {
  trade: InterfaceTrade
  syncing?: boolean
  allowedSlippage?: Percent
  type: SwapLineItemType
  animatedOpacity?: SpringValue<number>
}

function SwapLineItem(props: SwapLineItemProps) {
  const LineItem = useLineItem(props)
  if (!LineItem) return null

  return (
    <animated.div style={{ opacity: props.animatedOpacity }}>
      <DetailLineItem LineItem={LineItem} syncing={props.syncing} />
    </animated.div>
  )
}

export default React.memo(SwapLineItem)
