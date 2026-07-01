import { useCallback, useMemo } from 'react'
import { buildTokenMarketPriceKey } from '~/features/Toucan/hooks/useTokenMarketPrices'
import { useAuctionTokenPrices } from '~/features/Toucan/hooks/useTopAuctions/useAuctionTokenPrices'
import {
  auctionCommittedVolumeComparator,
  type EnrichedAuction,
  useTopAuctions,
} from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'

const MAX_VERIFIED_AUCTIONS = 4

/**
 * Selects the top verified auctions to surface as chips: ongoing auctions first (sorted by committed
 * volume), then completed ones to fill any remaining slots. Shared by the Explore section and the
 * Positions empty state so both render the same set.
 */
export function useTopVerifiedAuctions(): {
  auctions: EnrichedAuction[]
  isLoading: boolean
  getAuctionTokenUsdPrice: (auction: EnrichedAuction) => number | undefined
} {
  const { auctions: allAuctions, isLoading } = useTopAuctions()
  const { priceMap: auctionTokenPriceMap } = useAuctionTokenPrices(allAuctions)

  const verifiedAuctions = useMemo(
    () => allAuctions.filter((enrichedAuction) => enrichedAuction.verified),
    [allAuctions],
  )

  const verifiedSortedOngoingAuctions = useMemo(
    () =>
      verifiedAuctions
        .filter((enrichedAuction) => !enrichedAuction.timeRemaining.isCompleted)
        .sort(auctionCommittedVolumeComparator),
    [verifiedAuctions],
  )

  const verifiedSortedCompletedAuctions = useMemo(
    () =>
      verifiedAuctions
        .filter((enrichedAuction) => {
          const auction = enrichedAuction.auction
          return (
            enrichedAuction.timeRemaining.isCompleted &&
            !!auction &&
            !!auction.endBlock &&
            !!auction.chainId &&
            enrichedAuction.timeRemaining.endBlockTimestamp !== undefined
          )
        })
        .sort(auctionCommittedVolumeComparator),
    [verifiedAuctions],
  )

  const auctions = useMemo(() => {
    const remainingSlots = Math.max(0, MAX_VERIFIED_AUCTIONS - verifiedSortedOngoingAuctions.length)
    return [...verifiedSortedOngoingAuctions, ...verifiedSortedCompletedAuctions.slice(0, remainingSlots)]
  }, [verifiedSortedOngoingAuctions, verifiedSortedCompletedAuctions])

  const getAuctionTokenUsdPrice = useCallback(
    (auction: EnrichedAuction): number | undefined => {
      if (!auction.auction) {
        return undefined
      }
      return auctionTokenPriceMap[
        buildTokenMarketPriceKey({
          chainId: auction.auction.chainId,
          address: auction.auction.tokenAddress,
        })
      ]
    },
    [auctionTokenPriceMap],
  )

  return { auctions, isLoading, getAuctionTokenUsdPrice }
}
