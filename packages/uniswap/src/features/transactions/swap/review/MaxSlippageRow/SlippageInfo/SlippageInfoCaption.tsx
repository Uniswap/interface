import { TradeType } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, isWeb, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SlippageInfoProps } from 'uniswap/src/features/transactions/swap/review/MaxSlippageRow/SlippageInfo/types'
import { useFormatSlippageAmount } from 'uniswap/src/features/transactions/swap/review/MaxSlippageRow/SlippageInfo/useFormatSlippageAmount'
import { TradeWithSlippage } from 'uniswap/src/features/transactions/swap/types/trade'
import { isMobileApp } from 'utilities/src/platform'

function SlippageWarningText(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered row gap="$spacing8">
      <AlertTriangleFilled color="$statusWarning" size="$icon.16" />
      <Text color="$statusWarning" variant={isWeb ? 'body4' : 'body2'}>
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

  return (
    <Flex gap="$spacing12" width="100%">
      <Text color="$neutral2" textAlign={isWeb ? 'left' : 'center'} variant={isWeb ? 'body4' : 'body2'}>
        {tradeType === TradeType.EXACT_INPUT
          ? t('swap.settings.slippage.input.message')
          : t('swap.settings.slippage.output.message')}{' '}
        {isWeb && (
          <Flex display="inline-flex">
            <LearnMoreLink url={uniswapUrls.helpArticleUrls.swapSlippage} textVariant="body4" textColor="white" />
          </Flex>
        )}
      </Text>

      {showSlippageWarning && isWeb && <SlippageWarningText />}

      <Flex
        backgroundColor="$surface2"
        borderRadius={isWeb ? '$rounded8' : '$rounded20'}
        gap="$spacing8"
        px={isWeb ? '$spacing8' : '$spacing16'}
        py={isWeb ? '$spacing8' : '$spacing12'}
        width="100%"
      >
        {isMobileApp && (
          <MobileAppSlippageInfo
            isCustomSlippage={isCustomSlippage}
            showSlippageWarning={showSlippageWarning}
            slippageTolerance={slippageTolerance}
          />
        )}

        <Flex row alignItems="center" gap={isWeb ? '$spacing8' : '$spacing12'} justifyContent="space-between">
          <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant={isWeb ? 'body4' : 'body2'}>
            {tradeType === TradeType.EXACT_INPUT
              ? t('swap.settings.slippage.input.receive.title')
              : t('swap.settings.slippage.output.spend.title')}
          </Text>
          <Text color="$neutral1" textAlign="center" variant={isWeb ? 'body4' : 'subheading2'}>
            {formattedSlippageAmount}
          </Text>
        </Flex>
      </Flex>

      {showSlippageWarning && isMobileApp && <SlippageWarningText />}
    </Flex>
  )
}
