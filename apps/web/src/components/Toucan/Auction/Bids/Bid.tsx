import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { useEvent } from 'utilities/src/react/hooks'
import { BidProgressBar } from '~/components/Toucan/Auction/Bids/BidProgressBar'
import { BidStatusIndicator } from '~/components/Toucan/Auction/Bids/BidStatusIndicator'
import { BidListItem } from '~/components/Toucan/Auction/hooks/useBidsListData'
import { UserBid } from '~/components/Toucan/Auction/store/types'
import { SubscriptZeroPrice } from '~/components/Toucan/Shared/SubscriptZeroPrice'
import { TimeCell } from '~/components/Toucan/Shared/TimeCell'

interface BidProps {
  item: BidListItem
  onPress: (bid: UserBid, isInRange: boolean) => void
}

export function Bid({ item, onPress }: BidProps): JSX.Element {
  const { t } = useTranslation()

  const {
    bid,
    isInRange,
    budgetDisplay,
    budgetFiatDisplay,
    maxFdvDisplay,
    timestampMs,
    fillFraction,
    filledPercentageDisplay,
    averagePriceData,
    totalTokensReceivedDisplay,
    displayState,
    isAuctionInProgress,
    isAuctionEnded,
    isComplete,
    bidTokenSymbol,
    auctionTokenSymbol,
    isGraduated,
  } = item

  // Hide bid details when auction has ended but not graduated
  const shouldHideBidDetails = isAuctionEnded && !isGraduated

  const isPending = displayState === 'pending'
  const isWithdrawn = displayState === 'withdrawn'
  const isRefunded = displayState === 'refundedInRange' || displayState === 'refundedOutOfRange'
  const showBadge = isWithdrawn || isRefunded

  const handlePress = useEvent(() => {
    // Don't allow clicking pending bids to open modal
    if (isPending) {
      return
    }
    onPress(bid, isInRange)
  })

  return (
    <TouchableArea onPress={handlePress} cursor={isPending ? 'default' : 'pointer'} width="100%">
      <Flex
        width="100%"
        borderRadius="$rounded12"
        backgroundColor="$surface2"
        px="$spacing12"
        py="$spacing8"
        gap="$spacing8"
      >
        {/* Line 1: Status indicator + Budget info + timestamp/badge */}
        <Flex row alignItems="center" gap="$spacing4" mt={1}>
          <BidStatusIndicator displayState={displayState} isComplete={isComplete} />
          <Text
            variant="body3"
            $lg={{ variant: 'body4' }}
            $md={{ variant: 'body3' }}
            $sm={{ variant: 'body4' }}
            color="$neutral1"
          >
            {budgetDisplay} {bidTokenSymbol}
          </Text>
          <Text
            variant="body3"
            $lg={{ variant: 'body4' }}
            $md={{ variant: 'body3' }}
            $sm={{ variant: 'body4' }}
            color="$neutral2"
          >
            ({budgetFiatDisplay})
          </Text>
          <Flex row alignItems="center" flex={1} minWidth={0}>
            <Text
              variant="body3"
              $lg={{ variant: 'body4' }}
              $md={{ variant: 'body3' }}
              $sm={{ variant: 'body4' }}
              color="$neutral2"
            >
              @{' '}
            </Text>
            <Text
              variant="body3"
              $lg={{ variant: 'body4' }}
              $md={{ variant: 'body3' }}
              $sm={{ variant: 'body4' }}
              color="$neutral1"
              numberOfLines={1}
            >
              {maxFdvDisplay} {t('stats.fdv')}
            </Text>
          </Flex>
          {showBadge ? (
            <Flex
              backgroundColor={isWithdrawn ? '$statusSuccess2' : '$surface3'}
              px="$spacing4"
              py="$spacing2"
              borderRadius="$rounded6"
            >
              <Text variant="buttonLabel4" color={isWithdrawn ? '$statusSuccess' : '$neutral2'} fontSize={8}>
                {isWithdrawn ? t('toucan.bid.withdrawn') : t('toucan.bid.refunded')}
              </Text>
            </Flex>
          ) : isPending ? (
            <Text variant="body4" color="$neutral2">
              {t('common.time.justNow')}
            </Text>
          ) : (
            <TimeCell timestamp={timestampMs} />
          )}
        </Flex>

        {/* Line 2: Progress bar with inline percentage */}
        <BidProgressBar
          fillFraction={fillFraction}
          percentage={filledPercentageDisplay}
          displayState={displayState}
          isAuctionInProgress={isAuctionInProgress}
          isComplete={isComplete}
        />

        {/* Line 3: Average price (with FDV) + Total tokens received */}
        <Flex row alignItems="flex-start" gap="$spacing12" mb={1}>
          {/* Average price column - now includes both price and FDV */}
          <Flex gap="$spacing2" minWidth="50%">
            <Text variant="body4" color="$neutral2" fontSize={10} lineHeight={10}>
              {t('toucan.bid.avgPriceLabel')}
            </Text>
            <Flex row alignItems="center" gap="$spacing4">
              {shouldHideBidDetails ? (
                <Text variant="body4" color="$neutral1">
                  -
                </Text>
              ) : averagePriceData?.avgPriceDecimal !== undefined ? (
                <>
                  <SubscriptZeroPrice
                    value={averagePriceData.avgPriceDecimal}
                    symbol={bidTokenSymbol}
                    variant="body4"
                    color="$neutral1"
                    minSignificantDigits={1}
                    maxSignificantDigits={3}
                  />
                  {/* Grey dot separator */}
                  <Flex width={2} height={2} borderRadius="$roundedFull" backgroundColor="$neutral1" />
                  <Text variant="body4" color="$neutral1">
                    {averagePriceData.fdvFromAvgPriceCompactDisplay} {t('stats.fdv')}
                  </Text>
                </>
              ) : (
                <Text variant="body4" color="$neutral1">
                  -
                </Text>
              )}
            </Flex>
          </Flex>
          {/* Total tokens received column */}
          <Flex flex={1} maxWidth={120} gap="$spacing2">
            <Text variant="body4" color="$neutral2" fontSize={10} lineHeight={10}>
              {t('toucan.bid.totalTokensReceivedLabel')}
            </Text>
            <Text variant="body4" color="$neutral1">
              {shouldHideBidDetails ? '-' : totalTokensReceivedDisplay} {auctionTokenSymbol}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
