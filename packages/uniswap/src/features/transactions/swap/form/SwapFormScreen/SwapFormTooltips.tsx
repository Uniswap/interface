import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Dot } from 'ui/src/components/icons/Dot'
import { ShieldCheck } from 'ui/src/components/icons/ShieldCheck'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { VerticalDotLine } from 'ui/src/components/icons/VerticalDotLine'
import { UniswapXText } from 'ui/src/components/text/UniswapXText'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import RoutingDiagram from 'uniswap/src/components/RoutingDiagram/RoutingDiagram'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { FormattedUniswapXGasFeeInfo } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FeeOnTransferFeeGroupProps } from 'uniswap/src/features/transactions/TransactionDetails/types'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import * as SwapDetailsTooltip from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapDetailsTooltip'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'
import getRoutingDiagramEntries from 'uniswap/src/utils/getRoutingDiagramEntries'

import { NumberType } from 'utilities/src/format/types'
import { isMobileApp } from 'utilities/src/platform'

export function YouReceiveDetailsTooltip({
  receivedAmount,
  feeOnTransferProps,
}: {
  receivedAmount: string
  feeOnTransferProps?: FeeOnTransferFeeGroupProps
}): JSX.Element {
  const { t } = useTranslation()
  const swapTxContext = useSwapTxContext()
  const isUniswapXContext = isUniswapX(swapTxContext)
  const { formatPercent } = useLocalizationContext()
  const { derivedSwapInfo } = useSwapFormContext()
  const swapFee = derivedSwapInfo.trade.trade?.swapFee
  const swapFeeUsd = getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo)
  const formatter = useLocalizationContext()
  const { convertFiatAmountFormatted } = formatter

  const outputCurrencyUSDValue = useUSDCValue(derivedSwapInfo.outputAmountUserWillReceive)
  const formattedOutputCurrencyUSDValue: string | undefined = outputCurrencyUSDValue
    ? convertFiatAmountFormatted(outputCurrencyUSDValue.toExact(), NumberType.FiatTokenQuantity)
    : undefined
  const formattedSwapFee =
    swapFee &&
    getFormattedCurrencyAmount(derivedSwapInfo.currencies[CurrencyField.OUTPUT]?.currency, swapFee.amount, formatter) +
      getSymbolDisplayText(derivedSwapInfo.currencies[CurrencyField.OUTPUT]?.currency.symbol)
  const formattedSwapFeeAmountFiat =
    swapFeeUsd && !isNaN(swapFeeUsd) ? convertFiatAmountFormatted(swapFeeUsd, NumberType.FiatGasPrice) : undefined

  return (
    <SwapDetailsTooltip.Outer>
      <SwapDetailsTooltip.Header
        title={{
          title: t('swap.bestPrice.through', { provider: isUniswapXContext ? 'UniswapX' : 'Uniswap API' }),
        }}
        Icon={isUniswapXContext ? UniswapX : UniswapLogo}
        iconColor="$accent1"
      />
      <SwapDetailsTooltip.Content>
        {feeOnTransferProps?.inputTokenInfo.fee.greaterThan(0) && (
          <SwapDetailsTooltip.Row>
            <SwapDetailsTooltip.LineItemLabel
              label={`${t('swap.details.feeOnTransfer', { tokenSymbol: feeOnTransferProps.inputTokenInfo.tokenSymbol })} (${formatPercent(feeOnTransferProps.inputTokenInfo.fee.toFixed(8))})`}
            />
            <SwapDetailsTooltip.LineItemValue
              value={feeOnTransferProps.inputTokenInfo.formattedAmount}
              usdValue={feeOnTransferProps.inputTokenInfo.formattedUsdAmount}
            />
          </SwapDetailsTooltip.Row>
        )}
        {feeOnTransferProps?.outputTokenInfo.fee.greaterThan(0) && (
          <SwapDetailsTooltip.Row>
            <SwapDetailsTooltip.LineItemLabel
              label={`${t('swap.details.feeOnTransfer', { tokenSymbol: feeOnTransferProps.outputTokenInfo.tokenSymbol })} (${formatPercent(feeOnTransferProps.outputTokenInfo.fee.toFixed(8))})`}
            />
            <SwapDetailsTooltip.LineItemValue
              value={feeOnTransferProps.outputTokenInfo.formattedAmount}
              usdValue={feeOnTransferProps.outputTokenInfo.formattedUsdAmount}
            />
          </SwapDetailsTooltip.Row>
        )}
        <SwapDetailsTooltip.Row>
          <SwapDetailsTooltip.LineItemLabel label={t('fee.uniswap', { percent: formatPercent(0.25) })} />
          <SwapDetailsTooltip.LineItemValue value={formattedSwapFee} usdValue={formattedSwapFeeAmountFiat} />
        </SwapDetailsTooltip.Row>
        <SwapDetailsTooltip.Row>
          <SwapDetailsTooltip.LineItemLabel label={t('common.youReceive')} />
          <SwapDetailsTooltip.LineItemValue value={receivedAmount} usdValue={formattedOutputCurrencyUSDValue} />
        </SwapDetailsTooltip.Row>
      </SwapDetailsTooltip.Content>
      <SwapDetailsTooltip.Separator />
      <SwapDetailsTooltip.Description text={t('swap.warning.uniswapFee.message')} />
    </SwapDetailsTooltip.Outer>
  )
}

export function AutoSlippageBadge(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex borderRadius="$rounded6" py="$spacing2" px="$spacing6" backgroundColor="$surface3">
      <Text variant="buttonLabel4" color="$neutral1">
        {t('common.automatic')}
      </Text>
    </Flex>
  )
}

const shieldKeyframe = `
  @keyframes shield-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(150, 70, 250, 0.2);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(150, 70, 250, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(150, 70, 250, 0);
    }
  }
`

const shieldIconKeyframe = `
  @keyframes shield-icon-pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.6;
    }
  }
`

export function MaxSlippageTooltip({
  receivedAmount,
  minimumAmount,
  autoSlippageEnabled,
  currentSlippageTolerance,
}: {
  receivedAmount: string
  minimumAmount: string
  autoSlippageEnabled?: boolean
  currentSlippageTolerance: string
}): JSX.Element | null {
  const { t } = useTranslation()
  const { derivedSwapInfo } = useSwapFormContext()
  const outputCurrencyInfo = derivedSwapInfo.currencies[CurrencyField.OUTPUT]

  if (isMobileApp) {
    return null
  }

  return (
    <SwapDetailsTooltip.Outer>
      <SwapDetailsTooltip.Header
        title={{
          title: t('swap.details.slippage.uniswap'),
        }}
        Icon={ShieldCheck}
        iconColor="$uniswapXPurple"
      />
      <SwapDetailsTooltip.Content>
        <SwapDetailsTooltip.Row>
          <Flex row gap="$spacing4">
            <Dot size="$icon.16" color="$neutral1" />
            <Text variant="body4" color="$neutral1">
              {t('swap.expected.price')}
            </Text>
          </Flex>
          <SwapDetailsTooltip.LineItemValue
            value={receivedAmount}
            logo={<CurrencyLogo currencyInfo={outputCurrencyInfo} size={16} />}
          />
        </SwapDetailsTooltip.Row>
        <Flex position="absolute" left={4} top={19}>
          <VerticalDotLine minHeight={12} color="$uniswapXPurple" />
        </Flex>
        <SwapDetailsTooltip.Row>
          <Flex row gap="$spacing4" position="relative">
            <style>{shieldKeyframe}</style>
            <style>{shieldIconKeyframe}</style>
            <Flex width="$spacing16" />
            <Flex
              row
              left={-3}
              top={-3}
              position="absolute"
              alignItems="center"
              justifyContent="center"
              borderWidth="$spacing1"
              borderColor="$surface3"
              borderRadius="$roundedFull"
              p="$spacing4"
              style={{ animation: 'shield-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
            >
              <Flex opacity={0.6} style={{ animation: 'shield-icon-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                <ShieldCheck size="$icon.12" color="$uniswapXPurple" />
              </Flex>
            </Flex>
            <SwapDetailsTooltip.LineItemLabel
              label={t('settings.maxSlippage.percent', { percent: currentSlippageTolerance })}
            />
            {autoSlippageEnabled && <AutoSlippageBadge />}
          </Flex>
        </SwapDetailsTooltip.Row>
        <Flex position="absolute" left={4} top={50}>
          <VerticalDotLine minHeight={12} color="$uniswapXPurple" />
        </Flex>
        <SwapDetailsTooltip.Row>
          <Flex row gap="$spacing4">
            <Dot size="$icon.16" color="$neutral1" />
            <SwapDetailsTooltip.LineItemLabel label={t('swap.min.price')} />
          </Flex>
          <SwapDetailsTooltip.LineItemValue
            value={minimumAmount}
            logo={<CurrencyLogo currencyInfo={outputCurrencyInfo} size={16} />}
          />
        </SwapDetailsTooltip.Row>
      </SwapDetailsTooltip.Content>
      <SwapDetailsTooltip.Separator />
      <SwapDetailsTooltip.Description
        text={t('swap.slippage.description')}
        learnMoreUrl={uniswapUrls.helpArticleUrls.swapSlippage}
      />
    </SwapDetailsTooltip.Outer>
  )
}

export function BestRouteTooltip(): JSX.Element | null {
  const { t } = useTranslation()
  const { trade } = useSwapTxContext()
  const routes = useMemo(() => (trade && isClassic(trade) ? getRoutingDiagramEntries(trade) : []), [trade])

  if (!trade || !isClassic(trade)) {
    return null
  }

  const { inputAmount, outputAmount } = trade

  return (
    <SwapDetailsTooltip.Outer>
      <SwapDetailsTooltip.Header
        title={{
          title: t('common.bestRoute.with', { provider: 'Uniswap API' }),
        }}
        Icon={UniswapLogo}
        iconColor="$accent1"
      />
      <SwapDetailsTooltip.Content>
        <SwapDetailsTooltip.Row>
          <Flex width="100%">
            <RoutingDiagram routes={routes} currencyIn={inputAmount.currency} currencyOut={outputAmount.currency} />
          </Flex>
        </SwapDetailsTooltip.Row>
      </SwapDetailsTooltip.Content>
      <SwapDetailsTooltip.Separator />
      <SwapDetailsTooltip.Description
        learnMoreUrl={uniswapUrls.helpArticleUrls.routingSettings}
        text={t('swap.autoRouter')}
      />
    </SwapDetailsTooltip.Outer>
  )
}

export function BestRouteUniswapXTooltip(): JSX.Element {
  const { t } = useTranslation()

  return (
    <SwapDetailsTooltip.Outer>
      <SwapDetailsTooltip.Header
        title={{
          title: t('common.bestRoute.with', { provider: 'UniswapX' }),
          uniswapX: true,
        }}
        Icon={UniswapX}
      />
      <SwapDetailsTooltip.Content>
        <SwapDetailsTooltip.Row>
          <SwapDetailsTooltip.LineItemLabel label={t('swap.settings.protection.title')} />
          <SwapDetailsTooltip.LineItemValue Icon={ShieldCheck} value={t('common.active')} iconColor="$uniswapXPurple" />
        </SwapDetailsTooltip.Row>
      </SwapDetailsTooltip.Content>
      <SwapDetailsTooltip.Description
        learnMoreUrl={uniswapUrls.helpArticleUrls.uniswapXInfo}
        text={t('routing.aggregateLiquidity.uniswapx')}
      />
    </SwapDetailsTooltip.Outer>
  )
}

export function NetworkCostTooltipClassic(): JSX.Element {
  const { t } = useTranslation()
  const { derivedSwapInfo } = useSwapFormContext()

  return (
    <SwapDetailsTooltip.Outer>
      <SwapDetailsTooltip.Header
        title={{ title: t('common.chain.networkCost', { chain: getChainInfo(derivedSwapInfo.chainId).name }) }}
        logo={<NetworkLogo chainId={derivedSwapInfo.chainId} size={16} />}
      />
      <SwapDetailsTooltip.Description
        learnMoreUrl={uniswapUrls.helpArticleUrls.networkFeeInfo}
        text={t('transaction.networkCost.description')}
      />
    </SwapDetailsTooltip.Outer>
  )
}

export function NetworkCostTooltipUniswapX({
  uniswapXGasFeeInfo,
}: {
  uniswapXGasFeeInfo: FormattedUniswapXGasFeeInfo
}): JSX.Element {
  const { t } = useTranslation()
  const { approvalFeeFormatted, wrapFeeFormatted, swapFeeFormatted, inputTokenSymbol } = uniswapXGasFeeInfo

  return (
    <SwapDetailsTooltip.Outer>
      <SwapDetailsTooltip.Header
        title={{ title: t('swap.warning.networkFee.message.uniswapX.title'), uniswapX: true }}
        Icon={UniswapX}
      />
      <SwapDetailsTooltip.Content>
        <SwapDetailsTooltip.Row>
          <SwapDetailsTooltip.LineItemLabel label={t('transaction.details.networkFee.swap')} />
          <Flex row gap="$spacing6">
            <Text color="$neutral2" textDecorationLine="line-through" variant="body4">
              {swapFeeFormatted}
            </Text>
            <UniswapXText variant="body4">{t('common.free')}</UniswapXText>
          </Flex>
        </SwapDetailsTooltip.Row>
        {wrapFeeFormatted && (
          <SwapDetailsTooltip.Row>
            <SwapDetailsTooltip.LineItemLabel label={t('swap.warning.networkFee.wrap')} />
            <SwapDetailsTooltip.LineItemValue value={wrapFeeFormatted} />
          </SwapDetailsTooltip.Row>
        )}
        {approvalFeeFormatted && (
          <SwapDetailsTooltip.Row>
            <SwapDetailsTooltip.LineItemLabel
              label={t('swap.warning.networkFee.allow', { inputTokenSymbol: inputTokenSymbol ?? '' })}
            />
            <SwapDetailsTooltip.LineItemValue value={approvalFeeFormatted} />
          </SwapDetailsTooltip.Row>
        )}
      </SwapDetailsTooltip.Content>
      <SwapDetailsTooltip.Separator />
      <SwapDetailsTooltip.Description
        learnMoreUrl={uniswapUrls.helpArticleUrls.uniswapXInfo}
        text={t('uniswapX.cost')}
      />
    </SwapDetailsTooltip.Outer>
  )
}

export function LargePriceDifferenceTooltip(): JSX.Element {
  const { t } = useTranslation()

  return (
    <SwapDetailsTooltip.Outer>
      <SwapDetailsTooltip.Header title={{ title: t('large.price.difference') }} />
      <SwapDetailsTooltip.Description
        text={t('large.price.difference.tooltip')}
        learnMoreUrl={uniswapUrls.helpArticleUrls.priceImpact}
      />
    </SwapDetailsTooltip.Outer>
  )
}

function FeeDetails(props: { tokenSymbol: string; feePercent: string }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      row
      p="$spacing8"
      backgroundColor="$surface2"
      borderRadius="$rounded8"
      justifyContent="space-between"
      alignItems="center"
    >
      <Text variant="body4" color="$neutral2">
        {t('swap.details.feeOnTransfer', { tokenSymbol: props.tokenSymbol })}
      </Text>
      <Text variant="body4" color="$neutral1">
        {props.feePercent}
      </Text>
    </Flex>
  )
}

export function SwapFeeOnTransferTooltip(props: FeeOnTransferFeeGroupProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const buyFeePercent = formatPercent(props.outputTokenInfo.fee.toFixed(8))
  const hasBuyFee = props.outputTokenInfo.fee.greaterThan(0)
  const sellFeePercent = formatPercent(props.inputTokenInfo.fee.toFixed(8))
  const hasSellFee = props.inputTokenInfo.fee.greaterThan(0)

  return (
    <SwapDetailsTooltip.Outer>
      <SwapDetailsTooltip.Header
        title={{
          title: t('token.safety.fee.detected'),
        }}
      />
      <SwapDetailsTooltip.Content>
        {hasBuyFee && (
          <SwapDetailsTooltip.Description
            text={t('token.safety.warning.tokenChargesFee.buy.message.descriptive', {
              tokenSymbol: props.outputTokenInfo.tokenSymbol,
              feePercent: buyFeePercent,
            })}
          />
        )}
        {hasSellFee && (
          <SwapDetailsTooltip.Description
            text={t('token.safety.warning.tokenChargesFee.sell.message.descriptive', {
              tokenSymbol: props.inputTokenInfo.tokenSymbol,
              feePercent: sellFeePercent,
            })}
          />
        )}
      </SwapDetailsTooltip.Content>
      {hasBuyFee && <FeeDetails tokenSymbol={props.outputTokenInfo.tokenSymbol} feePercent={buyFeePercent} />}
      {hasSellFee && <FeeDetails tokenSymbol={props.inputTokenInfo.tokenSymbol} feePercent={sellFeePercent} />}
    </SwapDetailsTooltip.Outer>
  )
}

export function AcrossRoutingInfoTooltip(): JSX.Element {
  const { t } = useTranslation()

  return (
    <SwapDetailsTooltip.Outer>
      <SwapDetailsTooltip.Description text={t('swap.details.orderRoutingInfo')} />
    </SwapDetailsTooltip.Outer>
  )
}
