import { useQuery } from '@tanstack/react-query'
import { GetAuctionActivityRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { AuctionProgressState } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'

interface UseLoadBidActivitiesParams {
  auctionAddress: string | undefined
  chainId: EVMUniverseChainId | undefined
}

const POLLING_INTERVAL = 12 * ONE_SECOND_MS

/**
 * Custom hook to load all bid activities for an auction
 * Handles polling, sorting, and deduplication
 */
export function useLoadBidActivities({ auctionAddress, chainId }: UseLoadBidActivitiesParams) {
  // Only poll when auction is actively running - activity data is static before start and after end
  const isAuctionActive = useAuctionStore((state) => state.progress.state === AuctionProgressState.IN_PROGRESS)

  // Only poll during active auction - activity data is static before/after
  const pollingInterval = useMemo(() => {
    if (!isAuctionActive) {
      return false
    }
    return POLLING_INTERVAL
  }, [isAuctionActive])

  // Fetch all bids with polling (only during active auction)
  const { data, error, isLoading } = useQuery(
    auctionQueries.getAuctionActivity({
      params: new GetAuctionActivityRequest({
        address: auctionAddress?.toLowerCase(),
        chainId,
      }),
      enabled: Boolean(auctionAddress && chainId),
      refetchInterval: pollingInterval,
    }),
  )

  // Deduplicate and sort API bids
  const sortedActivities = useMemo(() => {
    const bids = data?.activity ?? []

    // Deduplicate by bidId
    const seenBidIds = new Set<string>()
    const uniqueBids = bids.filter((bid) => {
      if (seenBidIds.has(bid.bidId)) {
        return false
      }
      seenBidIds.add(bid.bidId)
      return true
    })

    // Sort by timestamp (newest first)
    return uniqueBids.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [data])

  return {
    activities: sortedActivities,
    loading: isLoading,
    error,
  }
}
