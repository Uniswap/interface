import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { SlippageWarningContent } from 'wallet/src/features/transactions/swap/SlippageWarningContent'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'

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

  const acceptedTrade = acceptedDerivedSwapInfo.trade.trade

  if (!acceptedTrade) {
    throw new Error('Invalid render of `MaxSlippageInfo` with no `acceptedTrade`')
  }

  // Make text the warning color if user is setting custom slippage higher than auto slippage value
  const showSlippageWarning =
    autoSlippageTolerance && acceptedTrade ? acceptedTrade.slippageTolerance > autoSlippageTolerance : false

  return (
    <>
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
        <Flex centered row gap="$spacing8">
          {!customSlippageTolerance ? (
            <Flex centered backgroundColor="$surface3" borderRadius="$roundedFull" px="$spacing4" py="$spacing2">
              <Text color="$neutral2" variant="buttonLabel4">
                {t('swap.settings.slippage.control.auto')}
              </Text>
            </Flex>
          ) : null}
          <Text color={showSlippageWarning ? '$DEP_accentWarning' : '$neutral1'} variant="body3">
            {formatPercent(acceptedTrade?.slippageTolerance)}
          </Text>
        </Flex>
      </Flex>
    </>
  )
}
