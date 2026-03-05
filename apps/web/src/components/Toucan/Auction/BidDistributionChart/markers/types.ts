import { UserBid } from '~/components/Toucan/Auction/store/types'

/**
 * Represents the computed screen position and metadata for a bid marker
 */
export interface MarkerPosition {
  /** Unique identifier for this marker instance */
  id: string
  /** Horizontal position in pixels from left edge */
  left: number
  /** Vertical position in pixels from top edge */
  top: number
  /** Wallet address for the avatar */
  address: string
  /** The bids data at this position */
  bids: UserBid[]
  /** Whether the bids are at or above clearing price */
  isInRange: boolean
}

/**
 * Represents a group of bids at the same tick value
 */
export interface BidGroup {
  /** The tick value (price) for this group */
  tick: number
  /** All bids at this tick value */
  bids: UserBid[]
}
