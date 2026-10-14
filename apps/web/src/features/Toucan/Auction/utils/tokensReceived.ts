import { AuctionBidStatus, UserBid } from '~/features/Toucan/Auction/store/types'

/** Total auction tokens a bidder received across their bids, in raw units. */
export function sumTokensReceived(userBids: UserBid[]): bigint {
  return userBids.reduce((acc, bid) => acc + BigInt(bid.amount), 0n)
}

/** Bids the bidder has not claimed yet. */
export function filterUnclaimedBids<T extends { status: AuctionBidStatus }>(bids: readonly T[]): T[] {
  return bids.filter((bid) => bid.status !== AuctionBidStatus.Claimed)
}

/** Total auction tokens a bidder has yet to claim across their bids, in raw units. */
export function sumUnclaimedTokensReceived(bids: readonly UserBid[]): bigint {
  return sumTokensReceived(filterUnclaimedBids(bids))
}
