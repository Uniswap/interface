import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BidListItem } from '~/features/Toucan/Auction/hooks/useBidsListData'
import { useWithdrawButtonState } from '~/features/Toucan/Auction/hooks/useWithdrawButtonState'
import { AuctionBidStatus, AuctionOutcome, UserBid } from '~/features/Toucan/Auction/store/types'

const mockBidsListData = { bidItems: [] as BidListItem[], hasErrors: false }
const mockStoreState = {
  pendingWithdrawalBidIds: new Set<string>(),
  awaitingConfirmationBidIds: new Set<string>(),
}
let mockDurationRemaining: string | undefined

vi.mock('~/features/Toucan/Auction/hooks/useBidsListData', () => ({
  useBidsListData: () => mockBidsListData,
}))
vi.mock('~/features/Toucan/Auction/hooks/useDurationRemaining', () => ({
  useDurationRemaining: () => mockDurationRemaining,
}))
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

function makeBidItem(overrides: Partial<UserBid> = {}): BidListItem {
  return {
    bid: {
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
    },
  } as BidListItem
}

function renderWithdrawButton(outcome: AuctionOutcome) {
  return renderHook(() => useWithdrawButtonState({ outcome, currentBlockNumber: 200 }))
}

describe('useWithdrawButtonState', () => {
  beforeEach(() => {
    mockBidsListData.bidItems = [makeBidItem()]
    mockBidsListData.hasErrors = false
    mockStoreState.pendingWithdrawalBidIds = new Set()
    mockStoreState.awaitingConfirmationBidIds = new Set()
    mockDurationRemaining = undefined
  })

  it('offers the token claim on a graduated auction', () => {
    const { result } = renderWithdrawButton(AuctionOutcome.GRADUATED)

    expect(result.current.label).toBe('toucan.auction.withdrawTokens')
    expect(result.current.isDisabled).toBe(false)
  })

  it('offers the funds refund on an auction that genuinely failed', () => {
    const { result } = renderWithdrawButton(AuctionOutcome.FAILED)

    expect(result.current.label).toBe('toucan.auction.withdrawFunds')
    expect(result.current.isDisabled).toBe(false)
  })

  it('keeps the refund open before the claim block, which only gates the token claim', () => {
    const beforeClaimBlock = { claimBlock: '250', currentBlockNumber: 200 }
    const failed = renderHook(() => useWithdrawButtonState({ outcome: AuctionOutcome.FAILED, ...beforeClaimBlock }))
    const graduated = renderHook(() =>
      useWithdrawButtonState({ outcome: AuctionOutcome.GRADUATED, ...beforeClaimBlock }),
    )
    expect(failed.result.current.isDisabled).toBe(false)
    expect(graduated.result.current.isDisabled).toBe(true)
  })

  // The bug this guards: UNKNOWN reached this hook as `isGraduated === false`, so a bidder on an
  // auction that DID graduate was offered "Withdraw funds" — a refund they were not entitled to.
  it('promises neither tokens nor a refund while the outcome is undecided', () => {
    const { result } = renderWithdrawButton(AuctionOutcome.UNKNOWN)

    expect(result.current.label).toBe('common.loading')
    expect(result.current.isDisabled).toBe(true)
  })

  it('promises neither tokens nor a refund while the auction is still running', () => {
    const { result } = renderWithdrawButton(AuctionOutcome.ACTIVE)

    expect(result.current.label).toBe('common.loading')
    expect(result.current.isDisabled).toBe(true)
  })

  it('reports funds already withdrawn once every bid on a failed auction has exited', () => {
    mockBidsListData.bidItems = [makeBidItem({ status: AuctionBidStatus.Exited })]

    const { result } = renderWithdrawButton(AuctionOutcome.FAILED)

    expect(result.current.label).toBe('toucan.auction.withdrawTokens.fundsWithdrawn')
    expect(result.current.isDisabled).toBe(true)
    expect(result.current.allBidsExited).toBe(true)
  })

  it('reports tokens already withdrawn once every bid on a graduated auction is claimed', () => {
    mockBidsListData.bidItems = [makeBidItem({ status: AuctionBidStatus.Claimed })]

    const { result } = renderWithdrawButton(AuctionOutcome.GRADUATED)

    expect(result.current.label).toBe('toucan.auction.withdrawTokens.tokensWithdrawn')
    expect(result.current.isDisabled).toBe(true)
  })
})
