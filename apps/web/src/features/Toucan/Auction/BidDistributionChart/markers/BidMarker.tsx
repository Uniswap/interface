import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip, useMedia } from 'ui/src'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'
import { MARKER_CONFIG } from '~/features/Toucan/Auction/BidDistributionChart/constants'
import { MarkerPosition } from '~/features/Toucan/Auction/BidDistributionChart/markers/types'
import { useBidStatusColors } from '~/features/Toucan/Auction/hooks/useBidStatusColors'
import { BidInfoTab, BidTokenInfo, UserBid } from '~/features/Toucan/Auction/store/types'
import { useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { BidAmountWithPrice } from '~/features/Toucan/Shared/BidAmountWithPrice'

interface BidMarkerProps {
  marker: MarkerPosition
  bidTokenInfo: BidTokenInfo
  formatPrice: (value: string, decimals: number) => string
  formatTokenAmount: (value: string, decimals: number) => string
}

interface BidTooltipRowProps {
  bid: UserBid
  bidTokenInfo: BidTokenInfo
  formatPrice: (value: string, decimals: number) => string
  formatTokenAmount: (value: string, decimals: number) => string
  isInRange: boolean
}

function BidTooltipRow({ bid, bidTokenInfo, formatPrice, formatTokenAmount, isInRange }: BidTooltipRowProps) {
  const { inRangeColor, outOfRangeColor } = useBidStatusColors()
  const { t } = useTranslation()

  const createdAtTimestamp = useMemo(() => {
    const parsed = Date.parse(bid.createdAt)
    return Number.isNaN(parsed) ? Date.now() : parsed
  }, [bid.createdAt])

  const timeAgo = useAbbreviatedTimeString(createdAtTimestamp)

  const priceDisplay = useMemo(
    () => formatPrice(bid.maxPrice, bidTokenInfo.decimals),
    [bid.maxPrice, bidTokenInfo.decimals, formatPrice],
  )

  const bidAmountDisplay = useMemo(
    () => formatTokenAmount(bid.baseTokenInitial, bidTokenInfo.decimals),
    [bid.baseTokenInitial, bidTokenInfo.decimals, formatTokenAmount],
  )

  const statusColor = isInRange ? inRangeColor : outOfRangeColor
  const statusText = isInRange ? t('toucan.bidDetails.status.inRange') : t('toucan.bidDetails.status.outOfRange')

  return (
    <Flex alignItems="flex-start">
      <Text variant="body4" color="$neutral2">
        {timeAgo}
      </Text>
      <BidAmountWithPrice amount={bidAmountDisplay} symbol={bidTokenInfo.symbol} price={priceDisplay} variant="body4" />
      <Flex row alignItems="center" gap="$spacing2">
        <Flex width={6} height={6} borderRadius="$roundedFull" backgroundColor={statusColor} />
        <Text variant="body4" color={statusColor}>
          {statusText}
        </Text>
      </Flex>
    </Flex>
  )
}

/**
 * Renders a user avatar marker on the chart with tooltip showing bid details.
 * Positioned absolutely based on the marker's calculated screen coordinates.
 *
 * @param marker - Computed position and bid data
 * @param bidTokenInfo - Token information for formatting
 * @param formatPrice - Price formatting function
 * @param formatTokenAmount - Token amount formatting function
 */
export function BidMarker({ marker, bidTokenInfo, formatPrice, formatTokenAmount }: BidMarkerProps) {
  const { bids, left, top, address, bidRangeMap } = marker
  const media = useMedia()
  const { t } = useTranslation()
  const { setChartSelectedBid, setActiveBidFormTab } = useAuctionStoreActions()

  const handleClick = useCallback(() => {
    if (bids.length === 1) {
      setChartSelectedBid({ bidId: bids[0].bidId, isInRange: bidRangeMap[bids[0].bidId] })
      setActiveBidFormTab(BidInfoTab.MY_BIDS)
    }
  }, [bids, bidRangeMap, setChartSelectedBid, setActiveBidFormTab])

  // Sort bids by creation time descending (newest first)
  const sortedBids = useMemo(() => {
    return [...bids].sort((a, b) => {
      const timeA = Date.parse(a.createdAt)
      const timeB = Date.parse(b.createdAt)
      return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA)
    })
  }, [bids])

  const displayBids = sortedBids.slice(0, MARKER_CONFIG.MAX_TOOLTIP_BIDS)
  const hiddenCount = Math.max(0, sortedBids.length - MARKER_CONFIG.MAX_TOOLTIP_BIDS)
  const showBadge = bids.length > 1

  if (media.lg) {
    return null
  }

  return (
    <Tooltip placement="right" delay={75} offset={{ mainAxis: 8 }}>
      <Tooltip.Trigger asChild>
        <Flex
          group
          position="absolute"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          pointerEvents="auto"
          onPress={handleClick}
          style={{
            left: `${left}px`,
            top: `${top}px`,
            transform: 'translate(-50%, 0)',
            zIndex: 1000,
          }}
        >
          <Flex opacity={0.54} $group-hover={{ opacity: 1 }} style={{ transition: 'opacity 0.15s ease' }}>
            <AccountIcon address={address} size={MARKER_CONFIG.AVATAR_SIZE} />
          </Flex>
          {showBadge && (
            <Flex
              position="absolute"
              inset={0}
              alignItems="center"
              justifyContent="center"
              borderRadius="$roundedFull"
              backgroundColor="$scrim"
              $group-hover={{ opacity: 0 }}
              style={{ transition: 'opacity 0.15s ease' }}
            >
              <Text variant="body4" fontSize={8} lineHeight={8} color="$white" fontWeight="600">
                {bids.length}
              </Text>
            </Flex>
          )}
        </Flex>
      </Tooltip.Trigger>
      <Tooltip.Content backgroundColor="transparent" borderWidth={0} p={0} pointerEvents="none">
        <Flex gap="$spacing2" flexDirection="column">
          {displayBids.map((bid) => (
            <Flex
              key={bid.bidId}
              backgroundColor="$surface1"
              borderRadius="$rounded12"
              borderWidth="$spacing1"
              borderColor="$surface3"
              py="$spacing6"
              px="$spacing8"
            >
              <BidTooltipRow
                bid={bid}
                bidTokenInfo={bidTokenInfo}
                formatPrice={formatPrice}
                formatTokenAmount={formatTokenAmount}
                isInRange={bidRangeMap[bid.bidId]}
              />
            </Flex>
          ))}
          {hiddenCount > 0 && (
            <Flex
              backgroundColor="$surface1"
              borderRadius="$rounded12"
              borderWidth="$spacing1"
              borderColor="$surface3"
              py="$spacing6"
              px="$spacing8"
              alignItems="center"
              justifyContent="center"
            >
              <Text variant="body4" color="$neutral2" textAlign="center">
                {t('toucan.bidMarker.moreNum', { num: hiddenCount })}
              </Text>
            </Flex>
          )}
        </Flex>
      </Tooltip.Content>
    </Tooltip>
  )
}
