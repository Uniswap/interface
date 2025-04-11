import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import { LoadingRow } from 'components/Loader/styled'
import RouterLabel from 'components/RouterLabel'
import { TooltipSize } from 'components/Tooltip'
import Row from 'components/deprecated/Row'
import { DetailLineItem, LineItemData } from 'components/swap/DetailLineItem'
import { GasBreakdownTooltip, UniswapXDescription } from 'components/swap/GasBreakdownTooltip'
import GasEstimateTooltip from 'components/swap/GasEstimateTooltip'
import { RoutingTooltip, SwapRoute } from 'components/swap/SwapRoute'
import TradePrice from 'components/swap/TradePrice'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { TFunction } from 'i18next'
import styled, { DefaultTheme } from 'lib/styled-components'
import React, { ReactNode, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { InterfaceTrade, SubmittableTrade, TradeFillType } from 'state/routing/types'
import { isLimitTrade, isPreviewTrade, isUniswapXTrade, isUniswapXTradeType } from 'state/routing/utils'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { SlippageTolerance } from 'state/user/types'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { Flex } from 'ui/src'
import { chainSupportsGasEstimates } from 'uniswap/src/features/chains/utils'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { getPriceImpactColor } from 'utils/prices'

export enum SwapLineItemType {
  EXCHANGE_RATE = 0,
  NETWORK_COST = 1,
  INPUT_TOKEN_FEE_ON_TRANSFER = 2,
  OUTPUT_TOKEN_FEE_ON_TRANSFER = 3,
  PRICE_IMPACT = 4,
  MAX_SLIPPAGE = 5,
  SWAP_FEE = 6,
  MAXIMUM_INPUT = 7,
  MINIMUM_OUTPUT = 8,
  ROUTING_INFO = 9,
  EXPIRY = 10,
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
`

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

function MinimumOutputTooltipContent({ amount }: { amount: CurrencyAmount<Currency> }) {
  const { formatCurrencyAmount } = useFormatter()
  const formattedAmount = formatCurrencyAmount({ amount, type: NumberType.SwapDetailsAmount })

  return (
    <BaseTooltipContent url="https://support.uniswap.org/hc/en-us/articles/8643794102669-Price-Impact-vs-Price-Slippage">
      <Trans i18nKey="swap.minPriceSlip.revert" values={{ amount: `${formattedAmount} ${amount.currency.symbol}` }} />
    </BaseTooltipContent>
  )
}

function Loading({ width = 50 }: { width?: number }) {
  return <LoadingRow data-testid="loading-row" height={15} width={width} />
}

function ColoredPercentRow({ percent }: { percent: Percent }) {
  const { formatPercent } = useFormatter()
  const formattedPercent = formatPercent(percent)
  const positivePercent = percent.lessThan(0) ? percent.multiply(-1) : percent
  return <ColorWrapper textColor={getPriceImpactColor(positivePercent)}>{formattedPercent}</ColorWrapper>
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
  if (outputFeeFiatValue === undefined) {
    return <CurrencyAmountRow amount={feeCurrencyAmount} />
  }

  return <>{formatNumber({ input: outputFeeFiatValue, type: NumberType.FiatGasPrice })}</>
}

// eslint-disable-next-line consistent-return
function useLineItem(props: SwapLineItemProps): LineItemData | undefined {
  const { t } = useTranslation()
  const { trade, syncing, allowedSlippage, type, priceImpact } = props
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
      if (!chainSupportsGasEstimates(chainId)) {
        return undefined
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
        return undefined
      }
      return {
        Label: () => <Trans i18nKey="swap.priceImpact" />,
        TooltipBody: () => <Trans i18nKey="swap.impactOfTrade" />,
        Value: () => (isPreview ? <Loading /> : <ColoredPercentRow percent={priceImpact} />),
      }
    case SwapLineItemType.MAX_SLIPPAGE:
      return {
        Label: () => <Trans i18nKey="settings.maxSlippage" />,
        TooltipBody: () => <SlippageTooltipContent />,
        Value: () => (
          <Row gap="8px">
            {isAutoSlippage && <AutoBadge>{t(`common.automatic`)}</AutoBadge>} {formatPercent(allowedSlippage)}
          </Row>
        ),
      }
    case SwapLineItemType.SWAP_FEE: {
      if (isPreview) {
        return { Label: () => <Trans i18nKey="common.fee" />, Value: () => <Loading /> }
      }
      return {
        Label: () => (
          <>
            <Trans i18nKey="common.fee" /> {trade.swapFee && `(${formatPercent(trade.swapFee.percent)})`}
          </>
        ),
        TooltipBody: () => <SwapFeeTooltipContent hasFee={Boolean(trade.swapFee)} />,
        Value: () => <FeeRow trade={trade} />,
      }
    }
    case SwapLineItemType.MAXIMUM_INPUT:
      if (trade.tradeType === TradeType.EXACT_INPUT) {
        return undefined
      }
      return {
        Label: () => <Trans i18nKey="swap.payAtMost" />,
        TooltipBody: () => <Trans i18nKey="swap.maxPriceSlip.revert" />,
        Value: () => <CurrencyAmountRow amount={trade.maximumAmountIn(allowedSlippage ?? new Percent(0))} />,
        loaderWidth: 70,
      }
    case SwapLineItemType.MINIMUM_OUTPUT:
      return {
        Label: () => <Trans i18nKey="swap.receive.atLeast" />,
        TooltipBody: () => (
          <MinimumOutputTooltipContent amount={trade.minimumAmountOut(allowedSlippage ?? new Percent(0))} />
        ),
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
      return getFOTLineItem({ ...props, t })
    case SwapLineItemType.EXPIRY:
      if (!isLimitTrade(trade)) {
        return undefined
      }
      return {
        Label: () => <Trans i18nKey="common.expiry" />,
        Value: () => <Row>{formatTimestamp(trade.deadline, true)}</Row>,
      }
  }
}

function getFOTLineItem({ type, trade, t }: SwapLineItemProps & { t: TFunction }): LineItemData | undefined {
  const isInput = type === SwapLineItemType.INPUT_TOKEN_FEE_ON_TRANSFER
  const currency = isInput ? trade.inputAmount.currency : trade.outputAmount.currency
  const tax = isInput ? trade.inputTax : trade.outputTax
  if (tax.equalTo(0)) {
    return undefined
  }

  const tokenSymbol = currency.symbol ?? currency.name

  return {
    Label: () => (
      <>{tokenSymbol ? t('swap.details.feeOnTransfer', { tokenSymbol }) : t('swap.details.feeOnTransfer.default')}</>
    ),
    TooltipBody: FOTTooltipContent,
    Value: () => <ColoredPercentRow percent={tax} />,
  }
}

interface SwapLineItemProps {
  trade: InterfaceTrade
  syncing?: boolean
  allowedSlippage?: Percent
  type: SwapLineItemType
  priceImpact?: Percent
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
