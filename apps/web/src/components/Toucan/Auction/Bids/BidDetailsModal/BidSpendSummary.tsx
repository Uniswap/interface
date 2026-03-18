import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useBidStatusColors } from '~/components/Toucan/Auction/hooks/useBidStatusColors'
import { type BidDisplayState } from '~/components/Toucan/Auction/utils/bidDetails'
import { ProgressBar } from '~/components/Toucan/Shared/ProgressBar'
import { SubscriptZeroPrice } from '~/components/Toucan/Shared/SubscriptZeroPrice'

interface BidSpendSummaryProps {
  spentAmount: number
  maxBudgetAmount: number
  bidTokenSymbol: string
  spentFraction: number
  displayState: BidDisplayState
  isAuctionEnded: boolean
}

export function BidSpendSummary({
  spentAmount,
  maxBudgetAmount,
  bidTokenSymbol,
  spentFraction,
  displayState,
  isAuctionEnded,
}: BidSpendSummaryProps): JSX.Element {
  const { t } = useTranslation()
  const { inRangeColor, inRangeColorLessOpacity, outOfRangeColor } = useBidStatusColors()

  const barColor = displayState === 'outOfRange' ? outOfRangeColor : inRangeColor
  const barFillBorder = displayState === 'outOfRange' ? outOfRangeColor : inRangeColorLessOpacity
  const shouldAnimate = displayState === 'inRange'
  const spendLabel =
    displayState === 'outOfRange' || isAuctionEnded
      ? t('toucan.bidDetails.label.totalSpent')
      : t('toucan.bidDetails.label.currentSpend')

  return (
    <Flex flex={1} minWidth={0} flexBasis={0} gap="$spacing12">
      <Flex gap="$spacing2">
        <Flex row justifyContent="space-between">
          <Text variant="body4" color="$neutral2">
            {spendLabel}
          </Text>
          <Text variant="body4" color="$neutral2">
            {t('toucan.bidDetails.label.maxBudget')}
          </Text>
        </Flex>
        <Flex row justifyContent="space-between">
          <SubscriptZeroPrice
            value={spentAmount}
            symbol={bidTokenSymbol}
            variant="body3"
            color="$neutral1"
            minSignificantDigits={1}
            maxSignificantDigits={4}
          />
          <SubscriptZeroPrice
            value={maxBudgetAmount}
            symbol={bidTokenSymbol}
            variant="body3"
            color="$neutral1"
            minSignificantDigits={1}
            maxSignificantDigits={4}
          />
        </Flex>
      </Flex>
      <ProgressBar
        percentage={spentFraction}
        color={barColor}
        borderColor="$surface3"
        fillBorderColor={barFillBorder}
        height={8}
        showWhiteDot={false}
        showEndDots={false}
        customFillStyle={{ backgroundImage: 'none' }}
        shouldAnimate={shouldAnimate}
      />
    </Flex>
  )
}
