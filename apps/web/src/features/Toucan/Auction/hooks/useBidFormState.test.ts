import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBidFormState } from '~/features/Toucan/Auction/hooks/useBidFormState'
import { AuctionBidStatus, AuctionProgressState, UserBid } from '~/features/Toucan/Auction/store/types'

const mockStoreState = {
  userBids: [] as UserBid[],
  userBidsInitialized: true,
  progress: { state: AuctionProgressState.ENDED, isGraduated: true },
}

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))

function makeBid(overrides: Partial<UserBid> = {}): UserBid {
  return {
    bidId: 'bid-1',
    auctionId: 'auction-1',
    walletId: '0x1111111111111111111111111111111111111111',
    txHash: '0xabc',
    amount: '1000',
    maxPrice: '79228162514264337593543950336',
    createdAt: '2026-07-01T00:00:00Z',
    status: AuctionBidStatus.Submitted,
    baseTokenInitial: '1000',
    currencySpent: '500',
    ...overrides,
  }
}

describe('useBidFormState', () => {
  beforeEach(() => {
    mockStoreState.userBids = [makeBid()]
    mockStoreState.userBidsInitialized = true
    mockStoreState.progress = { state: AuctionProgressState.ENDED, isGraduated: true }
  })

  describe('showAuctionGraduated', () => {
    it('is true when the auction has ended, graduated, and the user has bids', () => {
      const { result } = renderHook(() => useBidFormState())

      expect(result.current.showAuctionGraduated).toBe(true)
    })

    it('is false when the auction has not ended', () => {
      mockStoreState.progress = { state: AuctionProgressState.IN_PROGRESS, isGraduated: true }

      const { result } = renderHook(() => useBidFormState())

      expect(result.current.showAuctionGraduated).toBe(false)
    })

    it('is false when the auction did not graduate', () => {
      mockStoreState.progress = { state: AuctionProgressState.ENDED, isGraduated: false }

      const { result } = renderHook(() => useBidFormState())

      expect(result.current.showAuctionGraduated).toBe(false)
    })

    it('is false when the user has no bids', () => {
      mockStoreState.userBids = []

      const { result } = renderHook(() => useBidFormState())

      expect(result.current.showAuctionGraduated).toBe(false)
    })
  })

  it('returns the full bid form state shape', () => {
    const { result } = renderHook(() => useBidFormState())

    expect(result.current).toEqual({
      canPlaceBid: false,
      showMobileWithdrawButton: true,
      showAuctionGraduated: true,
      hasUserBids: true,
      allBidsClaimed: false,
      isAuctionEnded: true,
      isGraduated: true,
      isLoading: false,
    })
  })
})
