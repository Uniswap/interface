import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'

interface BidTotalsSectionProps {
  tokenSymbol: string
  bidTokenSymbol: string
  totalTokensReceivedDisplay: string
  filledPercentageDisplay: string
  showUnusedBudget: boolean
  refundBudgetLabel: string
  refundBudgetAmount: number
  refundBudgetSubtext: string
  // When the auction ended without graduating, no tokens are distributed — the
  // figure shown is what the bid would have received, so the label is reframed.
  isAuctionFailed: boolean
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
  isAuctionFailed,
}: BidTotalsSectionProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row gap="$spacing12" width="100%">
      <Flex backgroundColor="$surface2" borderRadius="$rounded16" padding="$spacing12" gap="$spacing4" flex={1}>
        <Text variant="body4" color="$neutral2">
          {isAuctionFailed
            ? t('toucan.bidDetails.label.totalWouldHaveReceived', { symbol: tokenSymbol })
            : t('toucan.bidDetails.label.totalReceived', { symbol: tokenSymbol })}
        </Text>
        <Text variant="heading3" color="$neutral1">
          {totalTokensReceivedDisplay}
        </Text>
        <Text variant="body4" color="$neutral2">
          {filledPercentageDisplay}
        </Text>
      </Flex>

      {showUnusedBudget ? (
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
