import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'

interface BidAveragePriceSectionProps {
  avgPriceDecimal: number
  bidTokenSymbol: string
  avgPriceFiat: string
  fdvFromAvgPriceDisplay: string
  percentBelowClearing: string
}

export function BidAveragePriceSection({
  avgPriceDecimal,
  bidTokenSymbol,
  avgPriceFiat,
  fdvFromAvgPriceDisplay,
  percentBelowClearing,
}: BidAveragePriceSectionProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex backgroundColor="$surface2" borderRadius="$rounded16" padding="$spacing12" gap="$spacing4" width="100%">
      <Text variant="body4" color="$neutral2">
        {t('toucan.bidDetails.label.averagePricePerToken')}
      </Text>
      <SubscriptZeroPrice
        value={avgPriceDecimal}
        symbol={bidTokenSymbol}
        variant="heading3"
        color="$neutral1"
        minSignificantDigits={1}
        maxSignificantDigits={3}
      />
      <Flex row gap="$spacing8" alignItems="center">
        <Text variant="body3" color="$neutral2">
          {avgPriceFiat}
        </Text>
        <Flex width={1} height={18} backgroundColor="$surface3" />
        <Text variant="body3" color="$neutral2">
          {fdvFromAvgPriceDisplay}
        </Text>
      </Flex>
      <Text variant="body4" color="$statusSuccess">
        {percentBelowClearing}
      </Text>
    </Flex>
  )
}
