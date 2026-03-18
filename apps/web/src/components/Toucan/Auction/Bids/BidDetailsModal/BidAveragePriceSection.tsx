import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { SubscriptZeroPrice } from '~/components/Toucan/Shared/SubscriptZeroPrice'

interface BidAveragePriceSectionProps {
  avgPriceDecimal: number
  bidTokenSymbol: string
  avgPriceFiat: string
  fdvFromAvgPriceDisplay: string
  percentBelowClearing: string
  isGraduated: boolean
  isAuctionEnded: boolean
}

export function BidAveragePriceSection({
  avgPriceDecimal,
  bidTokenSymbol,
  avgPriceFiat,
  fdvFromAvgPriceDisplay,
  percentBelowClearing,
  isGraduated,
  isAuctionEnded,
}: BidAveragePriceSectionProps): JSX.Element {
  const { t } = useTranslation()

  // Hide bid details when auction has ended but not graduated
  const shouldHideBidDetails = isAuctionEnded && !isGraduated

  return (
    <Flex backgroundColor="$surface2" borderRadius="$rounded16" padding="$spacing12" gap="$spacing4" width="100%">
      <Text variant="body4" color="$neutral2">
        {t('toucan.bidDetails.label.averagePricePerToken')}
      </Text>
      {shouldHideBidDetails ? (
        <Text variant="heading3" color="$neutral1">
          -
        </Text>
      ) : (
        <>
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
        </>
      )}
    </Flex>
  )
}
