import { Currency, TradeType } from '@uniswap/sdk-core'
import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, isWeb, useSporeColors } from 'ui/src'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import { Settings } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { WarningSeverity } from 'uniswap/src/features/transactions/WarningModal/types'
import { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { NumberType } from 'utilities/src/format/types'
import { WarningInfo } from 'wallet/src/components/modals/WarningModal/WarningInfo'
import { slippageToleranceToPercent } from 'wallet/src/features/transactions/swap/utils'

type SlippageWarningContentProps = PropsWithChildren<{
  trade: Trade<Currency, Currency, TradeType> | IndicativeTrade
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
          {!isWeb && (
            <AlertTriangleIcon
              color={colors.DEP_accentWarning.val}
              height={iconSizes.icon16}
              width={iconSizes.icon16}
            />
          )}
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
        closeText: t('common.button.close'),
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
