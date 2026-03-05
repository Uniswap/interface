import { AuctionBidStatus, UserBid } from '~/components/Toucan/Auction/store/types'

export function areAllBidsClaimed(userBids: UserBid[], isGraduated: boolean): boolean {
  const claimableBids = userBids.filter((bid) => BigInt(bid.amount) > 0n)
  if (claimableBids.length === 0) {
    return false
  }
  const expectedStatus = isGraduated ? AuctionBidStatus.Claimed : AuctionBidStatus.Exited
  return claimableBids.every((bid) => bid.status === expectedStatus)
}
