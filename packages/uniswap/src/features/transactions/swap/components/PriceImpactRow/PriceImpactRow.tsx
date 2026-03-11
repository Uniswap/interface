import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { MarketPriceImpactWarningModal } from 'uniswap/src/features/transactions/swap/components/PriceImpactRow/MarketPriceImpactWarning'
import { usePriceImpact } from 'uniswap/src/features/transactions/swap/components/PriceImpactRow/usePriceImpact'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'

export function PriceImpactRow({
  hide,
  derivedSwapInfo,
}: {
  hide?: boolean
  derivedSwapInfo: DerivedSwapInfo
}): JSX.Element | null {
  const { t } = useTranslation()

  const { formattedPriceImpact } = usePriceImpact({ derivedSwapInfo })
  const { priceImpactWarning } = useParsedSwapWarnings()
  const { text: priceImpactWarningColor } = getAlertColor(priceImpactWarning?.severity)

  const trade = derivedSwapInfo.trade.trade

  if (hide || !trade || isBridge(trade) || !formattedPriceImpact || !priceImpactWarning) {
    return null
  }

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <MarketPriceImpactWarningModal routing={trade.routing} missing={!formattedPriceImpact}>
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {t('swap.priceImpact')}
          </Text>
        </Flex>
      </MarketPriceImpactWarningModal>
      <Flex row centered shrink gap="$spacing6" justifyContent="flex-end">
        <AlertTriangleFilled color={priceImpactWarningColor} size="$icon.16" />
        <Text adjustsFontSizeToFit color={priceImpactWarningColor} variant="body3">
          {formattedPriceImpact}
        </Text>
      </Flex>
    </Flex>
  )
}
