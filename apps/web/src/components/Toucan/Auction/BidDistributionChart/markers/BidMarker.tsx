import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip, useMedia } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useAbbreviatedTimeString } from '~/components/Table/utils'
import { MARKER_CONFIG } from '~/components/Toucan/Auction/BidDistributionChart/constants'
import { MarkerPosition } from '~/components/Toucan/Auction/BidDistributionChart/markers/types'
import { useBidStatusColors } from '~/components/Toucan/Auction/hooks/useBidStatusColors'
import { BidTokenInfo, UserBid } from '~/components/Toucan/Auction/store/types'
import { BidAmountWithPrice } from '~/components/Toucan/Shared/BidAmountWithPrice'

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
  const { bids, left, top, address, isInRange } = marker
  const media = useMedia()
  const { t } = useTranslation()

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
          position="absolute"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          pointerEvents="auto"
          style={{
            left: `${left}px`,
            top: `${top}px`,
            transform: 'translate(-50%, 0)',
            zIndex: 1000,
          }}
        >
          <AccountIcon address={address} size={MARKER_CONFIG.AVATAR_SIZE} />
          {showBadge && (
            <Flex
              position="absolute"
              bottom={4}
              right={-4}
              backgroundColor="$surface1"
              borderRadius="$roundedFull"
              minWidth={12}
              height={12}
              px="$spacing2"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="$surface3"
            >
              <Text variant="body4" fontSize={10} lineHeight={10} color="$neutral1">
                {bids.length}
              </Text>
            </Flex>
          )}
        </Flex>
      </Tooltip.Trigger>
      <Tooltip.Content
        backgroundColor="transparent"
        borderWidth={0}
        p={0}
        pointerEvents="none"
        zIndex={zIndexes.overlay}
      >
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
                isInRange={isInRange}
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
