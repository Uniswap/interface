import type { Bid as ApiBid } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { AuctionBidStatus, UserBid } from '~/components/Toucan/Auction/store/types'

function normalizeBidStatus(status?: string): AuctionBidStatus {
  const lowerStatus = status?.toLowerCase()
  switch (lowerStatus) {
    case AuctionBidStatus.Exited:
      return AuctionBidStatus.Exited
    case AuctionBidStatus.Claimed:
      return AuctionBidStatus.Claimed
    case AuctionBidStatus.Submitted:
    default:
      return AuctionBidStatus.Submitted
  }
}

export function mapApiBidToUserBid(bid: ApiBid): UserBid {
  return {
    bidId: bid.bidId,
    auctionId: bid.auctionId,
    walletId: bid.walletId,
    txHash: bid.txHash,
    amount: bid.amount,
    maxPrice: bid.maxPrice,
    createdAt: bid.createdAt,
    status: normalizeBidStatus(bid.status),
    baseTokenInitial: bid.baseTokenInitial,
    currencySpent: bid.currencySpent,
  }
}
