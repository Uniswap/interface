import { TradeType } from '@uniswap/sdk-core'
import { isMobileApp, isWebPlatform } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SlippageInfoProps } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/SlippageInfo/types'
import { useFormatSlippageAmount } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/SlippageInfo/useFormatSlippageAmount'
import { TradeWithSlippage } from 'uniswap/src/features/transactions/swap/types/trade'
import { isChained } from 'uniswap/src/features/transactions/swap/utils/routing'

function SlippageWarningText(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered row gap="$spacing8">
      <AlertTriangleFilled color="$statusWarning" size="$icon.16" />
      <Text color="$statusWarning" variant={isWebPlatform ? 'body4' : 'body2'}>
        {t('swap.settings.slippage.warning.message')}
      </Text>
    </Flex>
  )
}

function MobileAppSlippageInfo({
  isCustomSlippage,
  showSlippageWarning,
  slippageTolerance,
}: {
  isCustomSlippage: boolean
  showSlippageWarning: boolean
  slippageTolerance: number | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  return (
    <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
      <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant="body2">
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
        <Text color={showSlippageWarning ? '$statusWarning' : '$neutral1'} variant="subheading2">
          {formatPercent(slippageTolerance)}
        </Text>
      </Flex>
    </Flex>
  )
}

export function SlippageInfoCaption({
  trade,
  isCustomSlippage,
  autoSlippageTolerance,
}: Omit<SlippageInfoProps, 'children' | 'trade'> & { trade: TradeWithSlippage }): JSX.Element {
  const { t } = useTranslation()
  const { slippageTolerance, tradeType } = trade
  const showSlippageWarning = Boolean(autoSlippageTolerance && slippageTolerance > autoSlippageTolerance)
  const formattedSlippageAmount = useFormatSlippageAmount(trade)

  // For chained actions, slippage is applied per step, not as a total.
  // This means compound slippage can exceed what the user set (e.g. 6% per step → 11.64% total for 2 steps).
  // We show an explanatory message when the user has set custom slippage so they understand this behavior.
  const isChainedTrade = isChained(trade)
  const swapStepCount = isChainedTrade
    ? (trade.quote.quote.steps?.filter((s) => s.slippage !== undefined).length ?? 0)
    : 0
  const showChainedMessage = isChainedTrade && isCustomSlippage && swapStepCount > 1

  return (
    <Flex gap="$spacing12" width="100%">
      {showChainedMessage && (
        <Text
          color="$neutral2"
          textAlign={isWebPlatform ? 'left' : 'center'}
          variant={isWebPlatform ? 'body4' : 'body2'}
        >
          {t('swap.settings.slippage.chained.message', { count: swapStepCount })}
        </Text>
      )}
      <Text color="$neutral2" textAlign={isWebPlatform ? 'left' : 'center'} variant={isWebPlatform ? 'body4' : 'body2'}>
        {[TradeType.EXACT_INPUT, 'EXACT_INPUT'].includes(tradeType)
          ? t('swap.settings.slippage.input.message')
          : t('swap.settings.slippage.output.message')}{' '}
        {isWebPlatform && (
          <Flex display="inline-flex">
            <LearnMoreLink url={uniswapUrls.helpArticleUrls.swapSlippage} textVariant="body4" textColor="$neutral1" />
          </Flex>
        )}
      </Text>

      {showSlippageWarning && isWebPlatform && <SlippageWarningText />}

      <Flex
        backgroundColor="$surface2"
        borderRadius={isWebPlatform ? '$rounded8' : '$rounded20'}
        gap="$spacing8"
        px={isWebPlatform ? '$spacing8' : '$spacing16'}
        py={isWebPlatform ? '$spacing8' : '$spacing12'}
        width="100%"
      >
        {isMobileApp && (
          <MobileAppSlippageInfo
            isCustomSlippage={isCustomSlippage}
            showSlippageWarning={showSlippageWarning}
            slippageTolerance={slippageTolerance}
          />
        )}

        <Flex row alignItems="center" gap={isWebPlatform ? '$spacing8' : '$spacing12'} justifyContent="space-between">
          <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant={isWebPlatform ? 'body4' : 'body2'}>
            {[TradeType.EXACT_INPUT, 'EXACT_INPUT'].includes(tradeType)
              ? t('swap.settings.slippage.input.receive.title')
              : t('swap.settings.slippage.output.spend.title')}
          </Text>
          <Text color="$neutral1" textAlign="center" variant={isWebPlatform ? 'body4' : 'subheading2'}>
            {formattedSlippageAmount}
          </Text>
        </Flex>
      </Flex>

      {showSlippageWarning && isMobileApp && <SlippageWarningText />}
    </Flex>
  )
}
