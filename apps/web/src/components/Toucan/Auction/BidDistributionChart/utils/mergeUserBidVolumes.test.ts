import { mergeUserBidVolumes } from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'
import { AuctionBidStatus, OptimisticBid, UserBid } from '~/components/Toucan/Auction/store/types'

const createBid = (overrides: Partial<UserBid> = {}): UserBid => ({
  bidId: 'bid-id',
  auctionId: 'auction-id',
  walletId: 'wallet-id',
  txHash: 'tx-hash',
  amount: '0',
  maxPrice: '10',
  createdAt: '2024-01-01T00:00:00Z',
  status: AuctionBidStatus.Submitted,
  baseTokenInitial: '0',
  currencySpent: '0',
  ...overrides,
})

describe('mergeUserBidVolumes', () => {
  it('should return the original map when no user bids or optimistic bid', () => {
    const bidDistributionData = new Map([['10', '100']])

    const result = mergeUserBidVolumes({
      bidDistributionData,
      userBids: [],
      optimisticBid: null,
    })

    expect(result).toBe(bidDistributionData)
  })

  it('should add user bid volume when missing from distribution data', () => {
    const bidDistributionData = new Map<string, string>()
    const userBids = [createBid({ maxPrice: '10', baseTokenInitial: '100' })]

    const result = mergeUserBidVolumes({
      bidDistributionData,
      userBids,
      optimisticBid: null,
    })

    expect(result?.get('10')).toBe('100')
  })

  it('should not override higher existing volume', () => {
    const bidDistributionData = new Map([['10', '150']])
    const userBids = [createBid({ maxPrice: '10', baseTokenInitial: '100' })]

    const result = mergeUserBidVolumes({
      bidDistributionData,
      userBids,
      optimisticBid: null,
    })

    expect(result).toBe(bidDistributionData)
    expect(result?.get('10')).toBe('150')
  })

  it('should aggregate multiple bids at the same tick', () => {
    const bidDistributionData = new Map([['10', '50']])
    const userBids = [
      createBid({ maxPrice: '10', baseTokenInitial: '60', bidId: 'bid-1' }),
      createBid({ maxPrice: '10', baseTokenInitial: '70', bidId: 'bid-2' }),
    ]

    const result = mergeUserBidVolumes({
      bidDistributionData,
      userBids,
      optimisticBid: null,
    })

    expect(result).not.toBe(bidDistributionData)
    expect(result?.get('10')).toBe('130')
  })

  it('should include optimistic bid volume', () => {
    const bidDistributionData = new Map<string, string>()
    const optimisticBid: OptimisticBid = {
      maxPriceQ96: '20',
      budgetRaw: '42',
      bidTokenDecimals: 18,
      bidTokenSymbol: 'ETH',
      submittedAt: 1,
      txHash: '0x123',
    }

    const result = mergeUserBidVolumes({
      bidDistributionData,
      userBids: [],
      optimisticBid,
    })

    expect(result?.get('20')).toBe('42')
  })
})
