import { useAbbreviatedTimeString } from 'components/Table/utils'
import { BidActivity as BidActivityType } from 'components/Toucan/Auction/store/mockData'
import { DisplayMode } from 'components/Toucan/Auction/store/types'
import { useRef } from 'react'
import { Flex, Text, Unicon } from 'ui/src'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface BidActivityProps {
  activity: BidActivityType
  displayMode?: DisplayMode // TODO | Toucan: make this required once updated to use this
}

export const BidActivity = ({ activity }: BidActivityProps) => {
  // Convert unix timestamp to relative time string (e.g., "1s ago", "2m ago")
  const calculatedTimeAgo = useAbbreviatedTimeString(activity.timestamp * ONE_SECOND_MS)
  const timeAgoRef = useRef<string>(calculatedTimeAgo)
  const timeAgo = timeAgoRef.current

  // TODO | Toucan: Format price based on displayMode
  // - DisplayMode.VALUATION: show as "@ 2.5M" or "@ 2.5B" (market cap)
  // - DisplayMode.TOKEN_PRICE: show as "@ $2.50" (fiat price per token with user's selected currency)
  const formattedPrice = activity.price // Currently showing mock data, needs proper formatting

  return (
    <Flex
      row
      alignItems="center"
      backgroundColor="$surface2"
      borderRadius="$rounded12"
      height={48}
      px="$spacing12"
      gap="$spacing8"
    >
      {/* Left side: Icon + Bid info */}
      <Flex row alignItems="center" gap="$spacing8" flex={1}>
        <Unicon address={activity.walletAddress} size={24} />
        <Flex row alignItems="center" gap="$spacing4" px="$spacing8">
          <Text variant="body3" color="$neutral1">
            {/* TODO | Toucan: Update to use actual BidToken name instead of hardcoded USDC */}
            {activity.bidVolume} USDC
          </Text>
          <Text variant="body3" color="$neutral2">
            @
          </Text>
          <Text variant="body3" color="$neutral1">
            {formattedPrice}
          </Text>
        </Flex>
      </Flex>

      {/* Right side: Timestamp */}
      <Flex px="$spacing8">
        <Text variant="body3" color="$neutral2" textAlign="right">
          {timeAgo}
        </Text>
      </Flex>
    </Flex>
  )
}
