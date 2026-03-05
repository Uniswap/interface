import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { SubscriptZeroPrice } from '~/components/Toucan/Shared/SubscriptZeroPrice'

interface BidTotalsSectionProps {
  tokenSymbol: string
  bidTokenSymbol: string
  totalTokensReceivedDisplay: string
  filledPercentageDisplay: string
  showUnusedBudget: boolean
  refundBudgetLabel: string
  refundBudgetAmount: number
  refundBudgetSubtext: string
  isGraduated: boolean
  isAuctionEnded: boolean
}

export function BidTotalsSection({
  tokenSymbol,
  bidTokenSymbol,
  totalTokensReceivedDisplay,
  filledPercentageDisplay,
  showUnusedBudget,
  refundBudgetLabel,
  refundBudgetAmount,
  refundBudgetSubtext,
  isGraduated,
  isAuctionEnded,
}: BidTotalsSectionProps): JSX.Element {
  const { t } = useTranslation()

  // Hide bid details when auction has ended but not graduated
  const shouldHideBidDetails = isAuctionEnded && !isGraduated

  return (
    <Flex row gap="$spacing12" width="100%">
      <Flex backgroundColor="$surface2" borderRadius="$rounded16" padding="$spacing12" gap="$spacing4" flex={1}>
        <Text variant="body4" color="$neutral2">
          {t('toucan.bidDetails.label.totalReceived', { symbol: tokenSymbol })}
        </Text>
        <Text variant="heading3" color="$neutral1">
          {shouldHideBidDetails ? '-' : totalTokensReceivedDisplay}
        </Text>
        {!shouldHideBidDetails && (
          <Text variant="body4" color="$neutral2">
            {filledPercentageDisplay}
          </Text>
        )}
      </Flex>

      {!shouldHideBidDetails && showUnusedBudget ? (
        <Flex backgroundColor="$surface2" borderRadius="$rounded16" padding="$spacing12" gap="$spacing4" width={184}>
          <Text variant="body4" color="$neutral2">
            {refundBudgetLabel}
          </Text>
          <SubscriptZeroPrice
            value={refundBudgetAmount}
            symbol={bidTokenSymbol}
            variant="heading3"
            color="$neutral1"
            minSignificantDigits={1}
            maxSignificantDigits={4}
          />
          <Text variant="body4" color="$neutral2">
            {refundBudgetSubtext}
          </Text>
        </Flex>
      ) : null}
    </Flex>
  )
}
