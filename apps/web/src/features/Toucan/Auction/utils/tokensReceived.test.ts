import { AuctionBidStatus, type UserBid } from '~/features/Toucan/Auction/store/types'
import {
  filterUnclaimedBids,
  sumTokensReceived,
  sumUnclaimedTokensReceived,
} from '~/features/Toucan/Auction/utils/tokensReceived'

function bid(overrides: Partial<UserBid> = {}): UserBid {
  return {
    bidId: 'bid-1',
    auctionId: 'auction-1',
    walletId: '0x1111111111111111111111111111111111111111',
    txHash: '0xabc',
    amount: '1000',
    maxPrice: '1',
    createdAt: '2026-07-01T00:00:00Z',
    status: AuctionBidStatus.Submitted,
    baseTokenInitial: '1000',
    currencySpent: '500',
    ...overrides,
  }
}

describe('filterUnclaimedBids', () => {
  it('returns nothing for an empty list', () => {
    expect(filterUnclaimedBids([])).toEqual([])
  })

  it('drops every bid once they are all claimed', () => {
    expect(
      filterUnclaimedBids([
        bid({ bidId: 'a', status: AuctionBidStatus.Claimed }),
        bid({ bidId: 'b', status: AuctionBidStatus.Claimed }),
      ]),
    ).toEqual([])
  })

  it('keeps submitted and exited bids and drops the claimed ones', () => {
    const submitted = bid({ bidId: 'a', status: AuctionBidStatus.Submitted })
    const exited = bid({ bidId: 'b', status: AuctionBidStatus.Exited })
    expect(filterUnclaimedBids([submitted, bid({ bidId: 'c', status: AuctionBidStatus.Claimed }), exited])).toEqual([
      submitted,
      exited,
    ])
  })
})

describe('sumUnclaimedTokensReceived', () => {
  it('sums to zero for an empty list', () => {
    expect(sumUnclaimedTokensReceived([])).toBe(0n)
  })

  it('sums to zero once every bid is claimed', () => {
    expect(
      sumUnclaimedTokensReceived([
        bid({ bidId: 'a', amount: '400', status: AuctionBidStatus.Claimed }),
        bid({ bidId: 'b', amount: '600', status: AuctionBidStatus.Claimed }),
      ]),
    ).toBe(0n)
  })

  it('sums only the unclaimed bids', () => {
    const bids = [
      bid({ bidId: 'a', amount: '400', status: AuctionBidStatus.Submitted }),
      bid({ bidId: 'b', amount: '600', status: AuctionBidStatus.Claimed }),
      bid({ bidId: 'c', amount: '250', status: AuctionBidStatus.Exited }),
    ]
    expect(sumUnclaimedTokensReceived(bids)).toBe(650n)
    expect(sumTokensReceived(bids)).toBe(1250n)
  })
})
