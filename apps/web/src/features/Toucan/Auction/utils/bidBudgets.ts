import type { UserBid } from '~/features/Toucan/Auction/store/types'

/** Total original bid budgets in raw bid-currency units. Coercive like `sumTokensReceived`: `''` counts as 0n. */
export function sumBidBudgets(userBids: UserBid[]): bigint {
  return userBids.reduce((acc, bid) => acc + BigInt(bid.baseTokenInitial), 0n)
}
