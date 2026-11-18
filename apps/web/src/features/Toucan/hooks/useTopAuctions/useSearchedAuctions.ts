import type { PlainMessage } from '@bufbuild/protobuf'
import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import { AuctionLifecycle, SearchType } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import {
  AuctionLookupStatus,
  AuctionStatusFilter,
  type AuctionWithStats,
  GetAuctionRequest,
  type GetAuctionResponse,
} from '@uniswap/client-launches/dist/data/v1/auction_pb'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { getSearchAuctionAddress } from 'uniswap/src/features/dataApi/searchAuctions'
import { useSearchResults } from 'uniswap/src/features/dataApi/searchResults'
import { type EnrichedAuction, useEnrichedAuctions } from '~/features/Toucan/hooks/useTopAuctions/useEnrichedAuctions'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

const AUCTION_SEARCH_MAX_RESULTS = 25
// Search v2's per-type maximum; always requested so toggling a lifecycle filter reuses the cached search.
const AUCTION_SEARCH_MAX_CANDIDATES = 100
const AUCTION_SEARCH_TYPES = [SearchType.AUCTION]

const ENDED_LIFECYCLES = [AuctionLifecycle.GRADUATED, AuctionLifecycle.FAILED]
const LIVE_ONLY_LIFECYCLES = [AuctionLifecycle.UPCOMING, AuctionLifecycle.LIVE]
// Search ignores the graduation verdict, so both ended lifecycles are hydrated and the table's status
// filter decides after the result cap (a Launched or Failed search can show fewer rows than the cap).
const SEARCH_LIFECYCLES_BY_STATUS: Partial<Record<AuctionStatusFilter, AuctionLifecycle[]>> = {
  [AuctionStatusFilter.LIVE]: [AuctionLifecycle.LIVE],
  [AuctionStatusFilter.UPCOMING]: [AuctionLifecycle.UPCOMING],
  [AuctionStatusFilter.GRADUATED]: ENDED_LIFECYCLES,
  [AuctionStatusFilter.FAILED]: ENDED_LIFECYCLES,
}

function getSearchLifecycles({
  liveOnly,
  statusFilter,
}: {
  liveOnly: boolean
  statusFilter: AuctionStatusFilter | undefined
}): AuctionLifecycle[] | undefined {
  if (liveOnly) {
    return LIVE_ONLY_LIFECYCLES
  }
  return statusFilter === undefined ? undefined : SEARCH_LIFECYCLES_BY_STATUS[statusFilter]
}

// A failed GetAuction drops its row; the search errors only once every lookup settled with no rows.
function combineAuctionLookups(results: UseQueryResult<PlainMessage<GetAuctionResponse>>[]): {
  auctions: PlainMessage<AuctionWithStats>[]
  isLoading: boolean
  isError: boolean
} {
  const auctions = results.flatMap(({ data }) => {
    const auction = data?.auctions[0]
    return auction ? [{ auction, totalBidVolume: '', recentBids: [] }] : []
  })
  const isLoading = results.some((result) => result.isLoading)
  return {
    auctions,
    isLoading,
    isError:
      !isLoading &&
      auctions.length === 0 &&
      results.some(
        ({ data, isError }) => isError || (data !== undefined && data.lookupStatus !== AuctionLookupStatus.COMPLETE),
      ),
  }
}

/**
 * Global search's auction matches hydrated via GetAuction. Search only matches classified custom auctions
 * and returns a warned token only when the query is its address, so neither needs filtering here.
 */
export function useSearchedAuctions({
  searchQuery,
  chainId: chainIdOverride,
  liveOnly = false,
  statusFilter,
}: {
  searchQuery: string | undefined
  chainId?: UniverseChainId
  liveOnly?: boolean
  statusFilter?: AuctionStatusFilter
}): { auctions: EnrichedAuction[]; isLoading: boolean; isError: boolean } {
  const urlChainId = useChainIdFromUrlParam()
  const chainId = chainIdOverride ?? urlChainId
  const lifecycles = getSearchLifecycles({ liveOnly, statusFilter })

  const {
    data,
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useSearchResults({
    searchQuery: searchQuery ?? null,
    chainFilter: chainId ?? null,
    types: AUCTION_SEARCH_TYPES,
    skip: !searchQuery,
    size: AUCTION_SEARCH_MAX_CANDIDATES,
  })

  const auctionParams = useMemo(
    () =>
      (data?.auctions ?? [])
        .filter(
          ({ lifecycle }) =>
            !lifecycles || lifecycle === AuctionLifecycle.UNSPECIFIED || lifecycles.includes(lifecycle),
        )
        .map((auction) => ({ chainId: auction.chainId, address: getSearchAuctionAddress(auction) }))
        .filter(({ address }) => address !== '')
        .slice(0, AUCTION_SEARCH_MAX_RESULTS),
    [data?.auctions, lifecycles],
  )

  const {
    auctions: searchedAuctions,
    isLoading: isHydrating,
    isError: isHydrationError,
  } = useQueries({
    queries: auctionParams.map((params) => auctionQueries.getAuction({ params: new GetAuctionRequest(params) })),
    combine: combineAuctionLookups,
  })

  const { auctions, areBlocksSettled } = useEnrichedAuctions(searchedAuctions)

  return {
    auctions,
    isLoading: isSearchLoading || isHydrating || !areBlocksSettled,
    isError: isSearchError || isHydrationError,
  }
}
