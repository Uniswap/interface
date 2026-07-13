import { UserBid } from '~/features/Toucan/Auction/store/types'

/** Total auction tokens a bidder received across their bids, in raw units. */
export function sumTokensReceived(userBids: UserBid[]): bigint {
  return userBids.reduce((acc, bid) => acc + BigInt(bid.amount), 0n)
}
