import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { MarketPriceDifferenceWarningModal } from 'uniswap/src/features/transactions/swap/components/PriceDifferenceRow/MarketPriceDifferenceWarning'
import { usePriceDifference } from 'uniswap/src/features/transactions/swap/components/PriceDifferenceRow/usePriceDifference'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'

export function PriceDifferenceRow({
  hide,
  derivedSwapInfo,
}: {
  hide?: boolean
  derivedSwapInfo: DerivedSwapInfo
}): JSX.Element | null {
  const { t } = useTranslation()

  const { formattedPriceDifference } = usePriceDifference({ derivedSwapInfo })
  const { priceImpactWarning } = useParsedSwapWarnings()
  const { text: priceImpactWarningColor } = getAlertColor(priceImpactWarning?.severity)

  const trade = derivedSwapInfo.trade.trade

  if (hide || !trade || !formattedPriceDifference || !priceImpactWarning) {
    return null
  }

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <MarketPriceDifferenceWarningModal routing={trade.routing}>
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {t('swap.priceImpact')}
          </Text>
        </Flex>
      </MarketPriceDifferenceWarningModal>
      <Flex row centered shrink gap="$spacing6" justifyContent="flex-end">
        <AlertTriangleFilled color={priceImpactWarningColor} size="$icon.16" />
        <Text adjustsFontSizeToFit color={priceImpactWarningColor} variant="body3">
          {formattedPriceDifference}
        </Text>
      </Flex>
    </Flex>
  )
}
