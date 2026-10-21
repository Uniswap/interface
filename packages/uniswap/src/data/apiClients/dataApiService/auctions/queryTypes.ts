import type { GetAuctionRequest, GetLatestCheckpointRequest } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Query keys for auction queries that are also read outside `auctionQueries` (e.g. the auction hover card, which
 * loads the service client on demand). Kept here rather than there so those readers share the cache entry without
 * pulling in the client and transport.
 */
export const auctionQueryKeys = {
  getAuction: (params: GetAuctionRequest | undefined) => [ReactQueryCacheKey.AuctionApi, 'getAuction', params] as const,
  getLatestCheckpoint: (params: GetLatestCheckpointRequest | undefined) =>
    [ReactQueryCacheKey.AuctionApi, 'getLatestCheckpoint', params] as const,
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
