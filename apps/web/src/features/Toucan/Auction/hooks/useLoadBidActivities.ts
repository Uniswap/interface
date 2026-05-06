import { type InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  AuctionActivityEntry,
  GetAuctionActivityRequest,
  GetAuctionActivityResponse,
} from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useCallback, useEffect, useMemo } from 'react'
import { AuctionServiceClient } from 'uniswap/src/data/rest/auctions/AuctionServiceClient'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'

interface UseLoadBidActivitiesParams {
  auctionAddress: string | undefined
  chainId: EVMUniverseChainId | undefined
}

const POLLING_INTERVAL = 12 * ONE_SECOND_MS

export function useLoadBidActivities({ auctionAddress, chainId }: UseLoadBidActivitiesParams) {
  const queryClient = useQueryClient()
  const isAuctionActive = useAuctionStore((state) => state.progress.state === AuctionProgressState.IN_PROGRESS)
  const enabled = Boolean(auctionAddress && chainId)

  const queryKey = useMemo(
    () => [ReactQueryCacheKey.AuctionApi, 'getAuctionActivity', auctionAddress, chainId] as const,
    [auctionAddress, chainId],
  )

  const { data, error, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      AuctionServiceClient.getAuctionActivity(
        new GetAuctionActivityRequest({
          address: auctionAddress?.toLowerCase(),
          chainId,
          pageToken: pageParam,
        }),
      ),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: GetAuctionActivityResponse) => lastPage.nextPageToken || undefined,
    enabled,
  })

  // Poll for new bids by refetching only the first page (only during active auction)
  useEffect(() => {
    if (!enabled || !isAuctionActive) {
      return undefined
    }
    const interval = setInterval(async () => {
      try {
        const firstPage = await AuctionServiceClient.getAuctionActivity(
          new GetAuctionActivityRequest({
            address: auctionAddress?.toLowerCase(),
            chainId,
          }),
        )
        queryClient.setQueryData(queryKey, (old: InfiniteData<GetAuctionActivityResponse> | undefined) => {
          if (!old) {
            return old
          }
          return {
            ...old,
            pages: [firstPage, ...old.pages.slice(1)],
          }
        })
      } catch {
        // Silently skip failed polls — next interval will retry
      }
    }, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [enabled, isAuctionActive, auctionAddress, chainId, queryClient, queryKey])

  const activities = useMemo(() => {
    const allBids: AuctionActivityEntry[] = data?.pages.flatMap((page) => page.activity) ?? []

    const seenBidIds = new Set<string>()
    const deduped = allBids.filter((bid) => {
      if (seenBidIds.has(bid.bidId)) {
        return false
      }
      seenBidIds.add(bid.bidId)
      return true
    })

    // API returns activities in newest-first order — no client-side sort needed
    return deduped
  }, [data])

  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      fetchNextPage().then(
        () => setTimeout(() => onComplete?.(), 0),
        () => setTimeout(() => onComplete?.(), 0),
      )
    },
    [fetchNextPage],
  )

  return {
    activities,
    loading: isLoading,
    loadMore: hasNextPage ? loadMore : undefined,
    error,
  }
}
