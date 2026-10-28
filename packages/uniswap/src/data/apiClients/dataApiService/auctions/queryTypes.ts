import type {
  GetAuctionRequest,
  GetLatestCheckpointRequest,
  ListTopAuctionsRequest,
} from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Query keys for auction queries that are also read outside `auctionQueries` (e.g. the auction hover card and search
 * modal, which load the service client on demand). Kept here rather than there so those readers build the same key
 * shape without pulling in the client and transport; an entry is only shared when the request params match too.
 */
export const auctionQueryKeys = {
  getAuction: (params: GetAuctionRequest | undefined) => [ReactQueryCacheKey.AuctionApi, 'getAuction', params] as const,
  getLatestCheckpoint: (params: GetLatestCheckpointRequest | undefined) =>
    [ReactQueryCacheKey.AuctionApi, 'getLatestCheckpoint', params] as const,
  listTopAuctions: (params: ListTopAuctionsRequest | undefined) =>
    [ReactQueryCacheKey.AuctionApi, 'listTopAuctions', params] as const,
}

/**
 * The navbar search mounts on every page, so readers there load the client on demand; a static import would pull the
 * connect client and transport onto every page.
 */
export async function loadAuctionServiceClient(): Promise<
  typeof import('uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient').AuctionServiceClient
> {
  const { AuctionServiceClient } =
    await import('uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient')
  return AuctionServiceClient
}

/** Stale time constants for auction queries */
export const AuctionStaleTime = {
  /** Real-time data that needs frequent updates (2 seconds) - useGetLatestCheckpointQuery */
  REALTIME: 2 * ONE_SECOND_MS,
  /** Fast-changing data like bids and prices (15 seconds) */
  FAST: 15 * ONE_SECOND_MS,
  /** Moderate updates like activity and bids by wallet (30 seconds) */
  MODERATE: 30 * ONE_SECOND_MS,
  /** Slow-changing data like auction lists (60 seconds) */
  SLOW: ONE_MINUTE_MS,
} as const

/** Default retry count for auction queries */
export const AUCTION_DEFAULT_RETRY = 2
