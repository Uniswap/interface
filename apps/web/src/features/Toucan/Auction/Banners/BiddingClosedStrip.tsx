import { Flex, Text } from '@universe/mycelium'
import { Clock } from '@universe/mycelium/icons/Clock'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import {
  FORMAT_DATE_TIME_SHORT,
  useFormattedDateTime,
  useLocalizedDayjs,
} from 'uniswap/src/features/language/localizedDayjs'
import { useBlock } from 'wagmi'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { AuctionDisplayPhase } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { safeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'

/** "Bidding now closed — Auction ended {date}" under the stats banner once the auction has ended. */
export function BiddingClosedStrip(): JSX.Element | null {
  const { t } = useTranslation()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const isEnded = useAuctionDisplayState()?.phase === AuctionDisplayPhase.Ended

  // Prefer the indexed end time (zero means none was indexed); only ended auctions without one pay for
  // the end block's on-chain timestamp.
  const indexedSeconds = auctionDetails?.estimatedEndTime?.seconds
  const indexedEndSeconds = indexedSeconds !== undefined && indexedSeconds > 0n ? indexedSeconds : undefined
  const endBlock = safeBigInt(auctionDetails?.endBlock)
  const blockNumber = endBlock !== null && endBlock >= 0n ? endBlock : undefined
  const { data: endBlockData } = useBlock({
    chainId: auctionDetails?.chainId,
    blockNumber,
    query: {
      enabled:
        isEnded &&
        indexedEndSeconds === undefined &&
        auctionDetails?.chainId !== undefined &&
        blockNumber !== undefined,
    },
  })
  const endedAtSeconds = indexedEndSeconds ?? endBlockData?.timestamp

  const localizedDayjs = useLocalizedDayjs()
  const endedAt = useFormattedDateTime(
    localizedDayjs(endedAtSeconds === undefined ? undefined : Number(endedAtSeconds) * 1000),
    FORMAT_DATE_TIME_SHORT,
  )

  if (!isEnded) {
    return null
  }

  return (
    <Flex
      testID={TestID.ToucanBiddingClosedStrip}
      row
      alignItems="center"
      justifyContent="space-between"
      gap="$spacing8"
      backgroundColor="$surface2"
      borderRadius="$rounded12"
      px="$spacing16"
      py="$spacing12"
      mt="$spacing2"
      mb="$spacing12"
    >
      <Flex row alignItems="center" gap="$spacing8">
        <Clock size="$icon.16" color="$neutral2" />
        <Text variant="body3" color="$neutral1">
          {t('toucan.auction.biddingClosed')}
        </Text>
      </Flex>
      {endedAtSeconds !== undefined && (
        <Text variant="body3" color="$neutral2">
          {t('toucan.auction.endedOn', { date: endedAt })}
        </Text>
      )}
    </Flex>
  )
}
