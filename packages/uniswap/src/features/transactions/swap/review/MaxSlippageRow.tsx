import { TradeType } from '@uniswap/sdk-core'
import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons/AlertTriangle'
import { Settings } from 'ui/src/components/icons/Settings'
import { IndicativeLoadingWrapper } from 'uniswap/src/components/misc/IndicativeLoadingWrapper'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { BridgeTrade, IndicativeTrade, TradeWithSlippage } from 'uniswap/src/features/transactions/swap/types/trade'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import { NumberType } from 'utilities/src/format/types'

interface MaxSlippageRowProps {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
}

export function MaxSlippageRow({
  acceptedDerivedSwapInfo,
  autoSlippageTolerance,
  customSlippageTolerance,
}: MaxSlippageRowProps): JSX.Element {
  const { t } = useTranslation()

  const formatter = useLocalizationContext()
  const { formatPercent } = formatter

  const acceptedTrade = acceptedDerivedSwapInfo.trade.trade ?? acceptedDerivedSwapInfo.trade.indicativeTrade

  if (!acceptedTrade) {
    throw new Error('Invalid render of `MaxSlippageInfo` with no `acceptedTrade`')
  }

  if (acceptedTrade instanceof BridgeTrade) {
    throw new Error('Invalid render of `MaxSlippageInfo` for bridge trade')
  }

  // If we don't have a custom slippage tolerance set, we won't have a tolerance to display for an indicative quote,
  // since only the full quote has a slippage tolerance. In this case, we display a loading state until the full quote is received.
  const showLoadingState = acceptedTrade.indicative && !acceptedTrade.slippageTolerance

  // Make text the warning color if user is setting custom slippage higher than auto slippage value
  const showSlippageWarning =
    acceptedTrade.slippageTolerance && autoSlippageTolerance
      ? acceptedTrade.slippageTolerance > autoSlippageTolerance
      : false

  return (
    <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
      <SlippageWarningContent
        autoSlippageTolerance={autoSlippageTolerance}
        isCustomSlippage={!!customSlippageTolerance}
        trade={acceptedTrade}
      >
        <TouchableArea flexShrink={1}>
          <Flex row alignItems="center" gap="$spacing4">
            <Text color="$neutral2" numberOfLines={3} variant="body3">
              {t('swap.details.slippage')}
            </Text>
          </Flex>
        </TouchableArea>
      </SlippageWarningContent>
      <IndicativeLoadingWrapper loading={showLoadingState}>
        <Flex centered row gap="$spacing8">
          {!customSlippageTolerance ? (
            <Flex centered backgroundColor="$surface3" borderRadius="$roundedFull" px="$spacing4" py="$spacing2">
              <Text color="$neutral2" variant="buttonLabel3">
                {t('swap.settings.slippage.control.auto')}
              </Text>
            </Flex>
          ) : null}
          <Text color={showSlippageWarning ? '$DEP_accentWarning' : '$neutral1'} variant="body3">
            {formatPercent(acceptedTrade?.slippageTolerance)}
          </Text>
        </Flex>
      </IndicativeLoadingWrapper>
    </Flex>
  )
}

type SlippageWarningContentProps = PropsWithChildren<{
  trade: TradeWithSlippage | IndicativeTrade
  isCustomSlippage: boolean
  autoSlippageTolerance?: number
}>

export function SlippageWarningContent({
  children,
  trade,
  isCustomSlippage,
  autoSlippageTolerance,
}: SlippageWarningContentProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const { formatCurrencyAmount, formatPercent } = useLocalizationContext()

  // Avoid showing min out / max in UI when on an indicative quote.
  if (trade.indicative) {
    return <>{children}</>
  }

  const { slippageTolerance, tradeType } = trade
  const showSlippageWarning = autoSlippageTolerance && slippageTolerance > autoSlippageTolerance
  const slippageTolerancePercent = slippageToleranceToPercent(slippageTolerance)
  const amount = formatCurrencyAmount({
    value:
      trade.tradeType === TradeType.EXACT_INPUT
        ? trade.minimumAmountOut(slippageTolerancePercent)
        : trade.maximumAmountIn(slippageTolerancePercent),
    type: NumberType.TokenTx,
  })
  const tokenSymbol =
    trade.tradeType === TradeType.EXACT_INPUT ? trade.outputAmount.currency.symbol : trade.inputAmount.currency.symbol

  const captionContent = (
    <Flex gap="$spacing12" width="100%">
      <Text color="$neutral2" textAlign={isWeb ? 'left' : 'center'} variant={isWeb ? 'buttonLabel1' : 'body2'}>
        {tradeType === TradeType.EXACT_INPUT
          ? t('swap.settings.slippage.input.message')
          : t('swap.settings.slippage.output.message')}
      </Text>
      <Flex
        backgroundColor="$surface2"
        borderRadius="$rounded20"
        gap="$spacing8"
        px="$spacing16"
        py="$spacing12"
        width="100%"
      >
        <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
          <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant={isWeb ? 'buttonLabel1' : 'body2'}>
            {t('swap.slippage.settings.title')}
          </Text>
          <Flex row gap="$spacing8">
            {!isCustomSlippage ? (
              <Flex centered backgroundColor="$accent2" borderRadius="$roundedFull" px="$spacing8">
                <Text color="$accent1" variant="buttonLabel3">
                  {t('swap.settings.slippage.control.auto')}
                </Text>
              </Flex>
            ) : null}
            <Text color={showSlippageWarning ? '$DEP_accentWarning' : '$neutral1'} variant="subheading2">
              {formatPercent(slippageTolerance)}
            </Text>
          </Flex>
        </Flex>
        <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
          <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant={isWeb ? 'buttonLabel2' : 'body2'}>
            {tradeType === TradeType.EXACT_INPUT
              ? t('swap.settings.slippage.input.receive.title')
              : t('swap.settings.slippage.output.spend.title')}
          </Text>
          <Text color="$neutral1" textAlign="center" variant="subheading2">
            {amount} {tokenSymbol}
          </Text>
        </Flex>
      </Flex>
      {showSlippageWarning ? (
        <Flex centered row gap="$spacing8">
          {!isWeb && <AlertTriangle color="DEP_accentWarning" size="$icon.16" />}
          <Text color="$DEP_accentWarning" variant={isWeb ? 'buttonLabel2' : 'body2'}>
            {t('swap.settings.slippage.warning.message')}
          </Text>
        </Flex>
      ) : null}
    </Flex>
  )

  return (
    <WarningInfo
      infoButton={
        <LearnMoreLink
          textVariant={isWeb ? 'buttonLabel3' : undefined}
          url={uniswapUrls.helpArticleUrls.swapSlippage}
        />
      }
      modalProps={{
        backgroundIconColor: colors.surface2.get(),
        captionComponent: captionContent,
        rejectText: t('common.button.close'),
        icon: <Settings color="$neutral2" size="$icon.28" />,
        modalName: ModalName.SlippageInfo,
        severity: WarningSeverity.None,
        title: t('swap.slippage.settings.title'),
      }}
      tooltipProps={{
        text: captionContent,
        placement: 'top',
      }}
    >
      {children}
    </WarningInfo>
  )
}
