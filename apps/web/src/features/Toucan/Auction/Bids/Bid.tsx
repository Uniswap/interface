import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { useEvent } from 'utilities/src/react/hooks'
import { BidProgressIndicator } from '~/features/Toucan/Auction/Bids/BidProgressIndicator'
import { BidListItem } from '~/features/Toucan/Auction/hooks/useBidsListData'
import { getDisplayStateColor, useBidStatusColors } from '~/features/Toucan/Auction/hooks/useBidStatusColors'
import { UserBid } from '~/features/Toucan/Auction/store/types'
import { type BidDisplayState } from '~/features/Toucan/Auction/utils/bidDetails'
import { useTimeAgo } from '~/features/Toucan/Shared/TimeCell'

interface BidProps {
  item: BidListItem
  onPress: (bid: UserBid, isInRange: boolean) => void
}

function getStatusText(displayState: BidDisplayState, t: (key: string) => string): string {
  switch (displayState) {
    case 'inRange':
    case 'complete':
      return t('toucan.bid.inRange')
    case 'outOfRange':
      return t('toucan.bid.outOfRange')
    case 'withdrawn':
      return t('toucan.bid.withdrawn')
    case 'refundedInRange':
    case 'refundedOutOfRange':
      return t('toucan.bid.refunded')
    case 'fundsAvailable':
      return t('toucan.bid.fundsAvailable')
    case 'pending':
      return t('toucan.bid.pending')
    default:
      return ''
  }
}

export function Bid({ item, onPress }: BidProps): JSX.Element {
  const { t } = useTranslation()
  const bidStatusColors = useBidStatusColors()

  const {
    bid,
    isInRange,
    budgetDisplay,
    maxFdvDisplay,
    timestampMs,
    fillFraction,
    filledPercentageDisplay,
    totalTokensReceivedDisplay,
    displayState,
    bidTokenSymbol,
    auctionTokenSymbol,
  } = item

  const isPending = displayState === 'pending'
  const statusText = getStatusText(displayState, t)
  const statusColor = getDisplayStateColor(displayState, bidStatusColors)
  const timeAgo = useTimeAgo(timestampMs)

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
        p="$spacing12"
        py="$spacing8"
        gap="$spacing8"
      >
        <Flex row alignItems="flex-start" gap="$spacing12">
          <BidProgressIndicator displayState={displayState} fillFraction={fillFraction} />
          <Flex flex={1} gap="$spacing4" minWidth={0}>
            <Flex row alignItems="center" justifyContent="space-between">
              <Flex row alignItems="center" gap="$spacing4" flex={1} minWidth={0}>
                <Text variant="body3" color="$neutral1" numberOfLines={1} flexShrink={0}>
                  {totalTokensReceivedDisplay} {auctionTokenSymbol}
                </Text>
                <Text variant="body3" color="$neutral2" numberOfLines={1}>
                  ({filledPercentageDisplay} {t('toucan.bid.filled')})
                </Text>
              </Flex>
              <Text fontSize={10} lineHeight={10} color="$neutral2" flexShrink={0}>
                {isPending ? t('common.time.justNow') : timeAgo}
              </Text>
            </Flex>
            <Flex row alignItems="center" gap="$spacing4">
              <Text fontSize={10} lineHeight={10} color={statusColor}>
                {statusText}
              </Text>
              <Flex width={4} height={4} borderRadius="$roundedFull" backgroundColor="$neutral3" />
              <Text fontSize={10} lineHeight={10} color="$neutral2" numberOfLines={1} flexShrink={0}>
                {budgetDisplay} {bidTokenSymbol}
              </Text>
              <Flex row alignItems="center" flex={1} minWidth={0}>
                <Text fontSize={10} lineHeight={10} color="$neutral2">
                  @{' '}
                </Text>
                <Text fontSize={10} lineHeight={10} color="$neutral2" numberOfLines={1}>
                  {maxFdvDisplay} {t('stats.fdv')}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
