import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

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
