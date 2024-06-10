import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import { LoadingRow } from 'components/Loader/styled'
import RouterLabel from 'components/RouterLabel'
import Row from 'components/Row'
import { TooltipSize } from 'components/Tooltip'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { Trans, t } from 'i18n'
import React, { useEffect, useState } from 'react'
import { SpringValue, animated } from 'react-spring'
import { InterfaceTrade, SubmittableTrade, TradeFillType } from 'state/routing/types'
import { isLimitTrade, isPreviewTrade, isUniswapXTrade, isUniswapXTradeType } from 'state/routing/utils'
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
  display: flex;
  background: ${({ theme }) => theme.surface3};
  border-radius: 8px;
  color: ${({ theme }) => theme.neutral2};
  height: 20px;
  padding: 0 6px;
  align-items: center;

  ::after {
    content: '${t('commmon.automatic')}';
  }
`

export function FOTTooltipContent() {
  return (
    <>
      <Trans i18nKey="swap.tokenOwnFees" />{' '}
      <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/18673568523789-What-is-a-token-fee-">
        <Trans i18nKey="common.learnMore.link" />
      </ExternalLink>
    </>
  )
}

function SwapFeeTooltipContent({ hasFee, volatility }: { hasFee: boolean, volatility?: number }) {
  const message = hasFee ? 
  (volatility == 100 ? <Trans i18nKey="swap.fees.experience" /> : <div>Fee is proportional to expected volatility.</div>) : 
  <Trans i18nKey="swap.fees.noFee" />
  
  return (
    <>
      {message}{' '}
      <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/20131678274957">
        <Trans i18nKey="common.learnMore.link" />
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

function FeeRow({ trade: { swapFee, outputAmount}, volatility }: { trade: SubmittableTrade, volatility: number }) {
  const { formatNumber } = useFormatter()
  if (swapFee && volatility > 10000) {
    swapFee.percent = new Percent(volatility - 10000, 10000);
    swapFee.amount = String(Math.floor(Number(swapFee.amount) * volatility / 10000))
  }

  const feeCurrencyAmount = CurrencyAmount.fromRawAmount(outputAmount.currency, swapFee?.amount ?? 0)
  const { data: outputFeeFiatValue } = useUSDPrice(feeCurrencyAmount, feeCurrencyAmount?.currency)

  // Fallback to displaying token amount if fiat value is not available
  if (outputFeeFiatValue === undefined) {
    return <CurrencyAmountRow amount={feeCurrencyAmount} />
  }

  return <>{formatNumber({ input: outputFeeFiatValue, type: NumberType.FiatGasPrice })}</>
}

function useLineItem(props: SwapLineItemProps): LineItemData | undefined {
  const { trade, syncing, allowedSlippage, type, priceImpact, volatility } = props
  const { formatPercent } = useFormatter()
  const isAutoSlippage = useUserSlippageTolerance()[0] === SlippageTolerance.Auto

  const isUniswapX = isUniswapXTrade(trade)
  const isPreview = isPreviewTrade(trade)
  const chainId = trade.inputAmount.currency.chainId

  // Tracks the latest submittable trade's fill type, used to 'guess' whether or not to show price impact during preview
  const [lastSubmittableFillType, setLastSubmittableFillType] = useState<TradeFillType>()
  useEffect(() => {
    if (trade.fillType !== TradeFillType.None) {
      setLastSubmittableFillType(trade.fillType)
    }
  }, [trade.fillType])

  switch (type) {
    case SwapLineItemType.EXCHANGE_RATE:
      return {
        Label: () => (isLimitTrade(trade) ? <Trans i18nKey="limits.price.label" /> : <Trans i18nKey="common.rate" />),
        Value: () => <TradePrice price={trade.executionPrice} />,
        TooltipBody: !isPreview ? () => <RoutingTooltip trade={trade} /> : undefined,
        tooltipSize: isUniswapX ? TooltipSize.Small : TooltipSize.Large,
      }
    case SwapLineItemType.NETWORK_COST:
      if (!SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId)) {
        return
      }
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
    case SwapLineItemType.PRICE_IMPACT:
      // Hides price impact row if the current trade is UniswapX or we're expecting a preview trade to result in UniswapX
      if (isUniswapX || !priceImpact || (isPreview && isUniswapXTradeType(lastSubmittableFillType))) {
        return
      }
      return {
        Label: () => <Trans i18nKey="swap.priceImpact" />,
        TooltipBody: () => <Trans i18nKey="swap.impactOfTrade" />,
        Value: () => (isPreview ? <Loading /> : <ColoredPercentRow percent={priceImpact} estimate />),
      }
    case SwapLineItemType.MAX_SLIPPAGE:
      return {
        Label: () => <Trans i18nKey="settings.maxSlippage" />,
        TooltipBody: () => <MaxSlippageTooltip trade={trade} allowedSlippage={allowedSlippage ?? new Percent(0)} />,
        Value: () => (
          <Row gap="8px">
            {isAutoSlippage && <AutoBadge />} {formatPercent(allowedSlippage)}
          </Row>
        ),
      }
    case SwapLineItemType.SWAP_FEE: {
      if (isPreview) {
        return { Label: () => <Trans i18nKey="common.fee.caps" />, Value: () => <Loading /> }
      }
      return {
        Label: () => (
          <>
            <Trans i18nKey="common.fee.caps" /> {trade.swapFee && `(${formatPercent(trade.swapFee.percent)})`}
          </>
        ),
        TooltipBody: () => <SwapFeeTooltipContent volatility={volatility} hasFee={Boolean(trade.swapFee)} />,
        Value: () => <FeeRow trade={trade} volatility={Number(volatility)} />,
      }
    }
    case SwapLineItemType.MAXIMUM_INPUT:
      if (trade.tradeType === TradeType.EXACT_INPUT) {
        return
      }
      return {
        Label: () => <Trans i18nKey="swap.payAtMost" />,
        TooltipBody: () => <Trans i18nKey="swap.maxPriceSlip.revert" />,
        Value: () => <CurrencyAmountRow amount={trade.maximumAmountIn(allowedSlippage ?? new Percent(0))} />,
        loaderWidth: 70,
      }
    case SwapLineItemType.MINIMUM_OUTPUT:
      if (trade.tradeType === TradeType.EXACT_OUTPUT) {
        return
      }
      return {
        Label: () => <Trans i18nKey="swap.receive.atLeast" />,
        TooltipBody: () => <Trans i18nKey="swap.minPriceSlip.revert" />,
        Value: () => <CurrencyAmountRow amount={trade.minimumAmountOut(allowedSlippage ?? new Percent(0))} />,
        loaderWidth: 70,
      }
    case SwapLineItemType.ROUTING_INFO:
      if (isPreview || syncing) {
        return { Label: () => <Trans i18nKey="swap.orderRouting" />, Value: () => <Loading /> }
      }
      return {
        Label: () => <Trans i18nKey="swap.orderRouting" />,
        TooltipBody: () => {
          if (isUniswapX) {
            return <UniswapXDescription />
          }
          return <SwapRoute data-testid="swap-route-info" trade={trade} />
        },
        tooltipSize: isUniswapX ? TooltipSize.Small : TooltipSize.Large,
        Value: () => <RouterLabel trade={trade} />,
      }
    case SwapLineItemType.INPUT_TOKEN_FEE_ON_TRANSFER:
    case SwapLineItemType.OUTPUT_TOKEN_FEE_ON_TRANSFER:
      return getFOTLineItem(props)
    case SwapLineItemType.EXPIRY:
      if (!isLimitTrade(trade)) {
        return
      }
      return {
        Label: () => <Trans i18nKey="common.expiry" />,
        Value: () => <Row>{formatTimestamp(trade.deadline, true)}</Row>,
      }
  }
}

function getFOTLineItem({ type, trade }: SwapLineItemProps): LineItemData | undefined {
  const isInput = type === SwapLineItemType.INPUT_TOKEN_FEE_ON_TRANSFER
  const currency = isInput ? trade.inputAmount.currency : trade.outputAmount.currency
  const tax = isInput ? trade.inputTax : trade.outputTax
  if (tax.equalTo(0)) {
    return
  }

  return {
    Label: () => <>{t(`swap.namedFee`, { name: currency.symbol ?? currency.name ?? t('common.token') })}</>,
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
  priceImpact?: Percent
  volatility?: number
}

function SwapLineItem(props: SwapLineItemProps) {
  const LineItem = useLineItem(props)
  if (!LineItem) {
    return null
  }

  return (
    <animated.div style={{ opacity: props.animatedOpacity }}>
      <DetailLineItem LineItem={LineItem} syncing={props.syncing} />
    </animated.div>
  )
}

export default React.memo(SwapLineItem)
