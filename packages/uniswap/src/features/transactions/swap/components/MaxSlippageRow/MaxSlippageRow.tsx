import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { IndicativeLoadingWrapper } from 'uniswap/src/components/misc/IndicativeLoadingWrapper'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SlippageInfo } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/SlippageInfo/SlippageInfo'
import { AutoSlippageBadge } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips/MaxSlippageTooltip'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'

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
  const priceUxEnabled = usePriceUXEnabled()
  const { t } = useTranslation()

  const formatter = useLocalizationContext()
  const { formatPercent } = formatter

  const acceptedTrade = acceptedDerivedSwapInfo.trade.trade ?? acceptedDerivedSwapInfo.trade.indicativeTrade
  if (!acceptedTrade) {
    throw new Error('Invalid render of `MaxSlippageInfo` with no `trade`')
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
      <SlippageInfo
        autoSlippageTolerance={autoSlippageTolerance}
        isCustomSlippage={!!customSlippageTolerance}
        trade={acceptedTrade}
      >
        <Flex row shrink alignItems="center" gap="$spacing4">
          <Text color="$neutral2" numberOfLines={3} variant="body3">
            {priceUxEnabled ? t('settings.maxSlippage') : t('swap.details.slippage')}
          </Text>
        </Flex>
      </SlippageInfo>
      <IndicativeLoadingWrapper loading={showLoadingState}>
        <Flex centered row gap="$spacing8">
          {!customSlippageTolerance ? (
            priceUxEnabled ? (
              <AutoSlippageBadge />
            ) : (
              <Flex centered backgroundColor="$surface3" borderRadius="$roundedFull" px="$spacing4" py="$spacing2">
                <Text color="$neutral2" variant="buttonLabel3">
                  {t('swap.settings.slippage.control.auto')}
                </Text>
              </Flex>
            )
          ) : null}
          <Text color={showSlippageWarning ? '$statusWarning' : '$neutral1'} variant="body3">
            {acceptedTrade.slippageTolerance === 0 ? t('common.none') : formatPercent(acceptedTrade.slippageTolerance)}
          </Text>
        </Flex>
      </IndicativeLoadingWrapper>
    </Flex>
  )
}
