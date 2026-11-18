import type { PlainMessage } from '@bufbuild/protobuf'
import { useInfiniteQuery, useQueries, type UseQueryResult } from '@tanstack/react-query'
import {
  type Auction,
  type AuctionStatusFilter,
  type AuctionWithStats,
  GetAuctionRequest,
  type GetAuctionResponse,
  TopAuctionsOrder,
} from '@uniswap/client-launches/dist/data/v1/auction_pb'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { useVerifiedAuctionIds } from 'uniswap/src/features/toucan/useVerifiedAuctionIds'
import { useInfiniteLoadMore } from '~/components/Table/hooks/useInfiniteLoadMore'
import { approximateNumberFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { type EnrichedAuction, useEnrichedAuctions } from '~/features/Toucan/hooks/useTopAuctions/useEnrichedAuctions'
import { isQuickLaunchAuctionData } from '~/features/Toucan/utils/quickLaunchClassification'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/** ListTopAuctions caps page_size at 100. */
export const AUCTION_LIST_API_PAGE_SIZE = 100

/** Descending comparator that sorts rows without a sort value to the end. */
export function compareDescendingMissingLast(a: number | undefined, b: number | undefined): number {
  if (a === undefined && b === undefined) {
    return 0
  }
  if (a === undefined) {
    return 1
  }
  if (b === undefined) {
    return -1
  }
  return b - a
}

function getBidTokenVolume(auction: EnrichedAuction['auction']): number | undefined {
  if (!auction?.totalBidVolume || !auction.currencyTokenDecimals) {
    return undefined
  }
  return approximateNumberFromRaw({ raw: BigInt(auction.totalBidVolume), decimals: auction.currencyTokenDecimals })
}

export function auctionCommittedVolumeComparator(a: EnrichedAuction, b: EnrichedAuction): number {
  // USD when both sides have it (cross-currency comparison); otherwise fall back to the
  // bid-token amount so chains without a USD price feed (e.g. Robinhood) still sort.
  const aUsd = a.auction?.totalBidVolumeUsd
  const bUsd = b.auction?.totalBidVolumeUsd
  if (aUsd !== undefined && bUsd !== undefined) {
    return Number(bUsd) - Number(aUsd)
  }
  return compareDescendingMissingLast(getBidTokenVolume(a.auction), getBidTokenVolume(b.auction))
}

function combineVerifiedLookups(results: UseQueryResult<PlainMessage<GetAuctionResponse>>[]): {
  auctions: PlainMessage<Auction>[]
  isLoading: boolean
} {
  return {
    auctions: results.flatMap(({ data }) => {
      const auction = data?.auctions[0]
      return auction ? [auction] : []
    }),
    isLoading: results.some((result) => result.isLoading),
  }
}

/**
 * `chainId` overrides the URL-derived chain for surfaces without an /explore chain param (e.g. the
 * /launches Live-auctions view, which drives chain from local state instead of the URL).
 */
export function useTopAuctions({
  chainId: chainIdOverride,
  liveOnly = false,
  customOnly,
  statusFilter,
  pageSize = AUCTION_LIST_API_PAGE_SIZE,
  enabled = true,
}: {
  chainId?: UniverseChainId
  liveOnly?: boolean
  customOnly?: boolean
  statusFilter?: AuctionStatusFilter
  pageSize?: number
  enabled?: boolean
} = {}): {
  auctions: EnrichedAuction[]
  isLoading: boolean
  isError: boolean
  loadMore: (({ onComplete }: { onComplete?: () => void }) => void) | undefined
} {
  const urlChainId = useChainIdFromUrlParam()
  const chainId = chainIdOverride ?? urlChainId
  const verifiedAuctionIds = useVerifiedAuctionIds()

  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    ...auctionQueries.listTopAuctionsPages({
      params: {
        pageSize,
        chainIds: chainId ? [chainId] : [], // Empty array = all chains
        liveOnly, // Server drops auctions past their end block, keeping in-progress + upcoming.
        excludeUnsafeTokens: true,
        order: TopAuctionsOrder.LIFECYCLE,
        customOnly,
        statusFilter,
      },
    }),
    enabled,
  })

  // Offset cursors: an auction that changes lifecycle group between page fetches can appear on two pages
  // (deduped here) or be skipped until the next refetch; a single short-lived skip is tolerated.
  const topAuctions = useMemo(() => {
    const seenAuctionIds = new Set<string>()
    return (data?.pages ?? [])
      .flatMap((page) => page.auctions)
      .filter((auctionWithStats) => {
        const auctionId = auctionWithStats.auction?.auctionId
        if (auctionId === undefined || seenAuctionIds.has(auctionId)) {
          return false
        }
        seenAuctionIds.add(auctionId)
        return true
      })
  }, [data?.pages])

  const loadMore = useInfiniteLoadMore({ fetchNextPage, hasNextPage, isFetchingNextPage })

  // Parse verified IDs ("chainId_address") and filter by URL chain when present.
  // GetAuction is used as a fallback so verified auctions outside the top-N (e.g. not-yet-started
  // ones with zero bid volume) still surface in the verified section.
  const verifiedAuctionParams = useMemo<{ chainId: number; address: string }[]>(
    () =>
      verifiedAuctionIds
        .map((id) => {
          const sepIndex = id.indexOf('_')
          if (sepIndex < 0) {
            return undefined
          }
          const parsedChainId = Number(id.slice(0, sepIndex))
          const address = id.slice(sepIndex + 1)
          if (!Number.isFinite(parsedChainId) || !address) {
            return undefined
          }
          return { chainId: parsedChainId, address }
        })
        .filter((p): p is { chainId: number; address: string } => p !== undefined)
        .filter((p) => !chainId || p.chainId === chainId),
    [verifiedAuctionIds, chainId],
  )

  const topAuctionIdSet = useMemo(
    () => new Set(topAuctions.map((a) => a.auction?.auctionId).filter((id): id is string => id !== undefined)),
    [topAuctions],
  )

  // GetAuction ignores live_only, so the liveOnly view skips the fallback. A status filter keeps it:
  // filterAuctions status-matches the extras client-side along with the loaded rows.
  const missingVerifiedParams = useMemo(
    () =>
      !enabled || liveOnly
        ? []
        : verifiedAuctionParams.filter((p) => !topAuctionIdSet.has(`${p.chainId}_${p.address}`)),
    [verifiedAuctionParams, topAuctionIdSet, enabled, liveOnly],
  )

  const { auctions: verifiedFallbackAuctions, isLoading: isVerifiedFallbackLoading } = useQueries({
    queries: missingVerifiedParams.map((p) => auctionQueries.getAuction({ params: new GetAuctionRequest(p) })),
    combine: combineVerifiedLookups,
  })

  const mergedAuctions = useMemo<PlainMessage<AuctionWithStats>[]>(() => {
    const extras = verifiedFallbackAuctions
      .filter((auction) => !(customOnly && isQuickLaunchAuctionData(auction)))
      .map((auction) => ({ auction, totalBidVolume: '', recentBids: [] }))
    return extras.length > 0 ? [...topAuctions, ...extras] : topAuctions
  }, [topAuctions, verifiedFallbackAuctions, customOnly])

  const { auctions, areBlocksSettled } = useEnrichedAuctions(mergedAuctions)

  return {
    auctions,
    // Only the first page waits on block info as a whole, so the table never drops back to a skeleton mid-scroll.
    isLoading: isLoading || isVerifiedFallbackLoading || (!areBlocksSettled && (data?.pages.length ?? 0) <= 1),
    isError: isError && data === undefined,
    loadMore: hasNextPage ? loadMore : undefined,
  }
}
