import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBidsListData } from '~/features/Toucan/Auction/hooks/useBidsListData'
import { useWithdrawButtonState } from '~/features/Toucan/Auction/hooks/useWithdrawButtonState'
import type { AuctionDetails, AuctionProgressData, BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { AuctionBidStatus, AuctionOutcome, AuctionProgressState, UserBid } from '~/features/Toucan/Auction/store/types'

const ONE_Q96 = '79228162514264337593543950336'

const bidTokenInfo: BidTokenInfo = {
  symbol: 'ETH',
  decimals: 18,
  priceFiat: 0,
  isStablecoin: false,
  logoUrl: null,
}

const auctionDetails = {
  auctionId: 'auction-1',
  currency: '0x2222222222222222222222222222222222222222',
  chainId: 1,
  tokenTotalSupply: '0',
  token: { currency: { symbol: 'TKN', decimals: 18, name: 'Token' } },
} as unknown as AuctionDetails

function makeBid(overrides: Partial<UserBid> = {}): UserBid {
  return {
    bidId: 'bid-1',
    auctionId: 'auction-1',
    walletId: '0x1111111111111111111111111111111111111111',
    txHash: '0xabc',
    amount: '1000',
    maxPrice: ONE_Q96,
    createdAt: '2026-07-01T00:00:00Z',
    status: AuctionBidStatus.Submitted,
    baseTokenInitial: '1000',
    currencySpent: '500',
    ...overrides,
  }
}

const mockStoreState = {
  userBids: [makeBid()],
  auctionDetails,
  onchainCheckpoint: null,
  checkpointData: null,
  progress: { state: AuctionProgressState.ENDED, outcome: AuctionOutcome.FAILED } as Pick<
    AuctionProgressData,
    'state' | 'outcome'
  > &
    Partial<AuctionProgressData>,
  optimisticBid: null,
  pendingWithdrawalBidIds: new Set<string>(),
  awaitingConfirmationBidIds: new Set<string>(),
}

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) =>
    selector({ ...mockStoreState, progress: { isFinalPricePending: false, ...mockStoreState.progress } }),
}))
vi.mock('~/features/Toucan/Auction/hooks/useBidTokenInfo', () => ({
  useBidTokenInfo: () => ({ bidTokenInfo, loading: false }),
}))
vi.mock('~/features/Toucan/Auction/utils/clearingPrice', () => ({
  getClearingPrice: () => ONE_Q96,
}))
vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    formatNumberOrString: ({ value }: { value: unknown }) => String(value),
    convertFiatAmountFormatted: (value: number) => String(value),
  }),
}))
// Not the subject here, and it reaches for chain data. No claimBlock is passed below, so the
// claim-period branch of the button is inert either way.
vi.mock('~/features/Toucan/Auction/hooks/useDurationRemaining', () => ({
  useDurationRemaining: () => undefined,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('useBidsListData', () => {
  beforeEach(() => {
    mockStoreState.userBids = [makeBid()]
    mockStoreState.progress = { state: AuctionProgressState.ENDED, outcome: AuctionOutcome.FAILED }
  })

  it('marks bids on a genuinely failed auction as having funds available', () => {
    const { result } = renderHook(() => useBidsListData())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.bidItems).toHaveLength(1)
    expect(result.current.bidItems[0]!.displayState).toBe('fundsAvailable')
  })

  // Mirrors the graduated case in bidDetails.test.ts: a fully filled bid resolves to 'complete',
  // never to the refund state. Asserted as a positive literal behind a length check so an empty
  // list cannot satisfy it.
  it('shows the completed state, not the refund state, on a graduated auction', () => {
    mockStoreState.progress = { state: AuctionProgressState.ENDED, outcome: AuctionOutcome.GRADUATED }
    mockStoreState.userBids = [makeBid({ currencySpent: '1000' })] // fully filled

    const { result } = renderHook(() => useBidsListData())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.bidItems).toHaveLength(1)
    expect(result.current.bidItems[0]!.displayState).toBe('complete')
  })

  it('shows a live in-range state for a partially filled bid on a graduated auction', () => {
    mockStoreState.progress = { state: AuctionProgressState.ENDED, outcome: AuctionOutcome.GRADUATED }

    const { result } = renderHook(() => useBidsListData())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.bidItems).toHaveLength(1)
    expect(result.current.bidItems[0]!.displayState).toBe('inRange')
  })

  // Ended-ness must come from `outcome`, not from progress state. Fed an incoherent pair — the
  // exact shape that caused the original bug, where a coerced ENDED met an undecided outcome — the
  // row follows `outcome`, so the item flag and the status copy cannot disagree.
  it('derives the row isAuctionEnded flag from the outcome, not the progress state', () => {
    mockStoreState.progress = { state: AuctionProgressState.UNKNOWN, outcome: AuctionOutcome.FAILED }

    const { result } = renderHook(() => useBidsListData())

    expect(result.current.bidItems).toHaveLength(1)
    expect(result.current.bidItems[0]!.isAuctionEnded).toBe(true)
    expect(result.current.bidItems[0]!.displayState).toBe('fundsAvailable')
  })

  // The bug this guards: with only the boolean, an undecided outcome rendered every bid as
  // 'fundsAvailable' — including bids on auctions that had in fact graduated.
  it('stays in its loading state while the outcome is undecided', () => {
    mockStoreState.progress = { state: AuctionProgressState.UNKNOWN, outcome: AuctionOutcome.UNKNOWN }

    const { result } = renderHook(() => useBidsListData())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.bidItems).toEqual([])
  })

  // A served verdict settles the outcome before the final checkpoint, but the fallback price can
  // lag it and would place an outbid bid in range.
  it('stays in its loading state on a graduated auction until the final price loads', () => {
    mockStoreState.progress = {
      state: AuctionProgressState.ENDED,
      outcome: AuctionOutcome.GRADUATED,
      isFinalPricePending: true,
    }

    const { result } = renderHook(() => useBidsListData())

    expect(result.current.isLoading).toBe(true)
  })
})

// useWithdrawButtonState.test.ts mocks useBidsListData to isolate the button. Here it is the real
// hook, so a single store `outcome` drives the per-bid copy and the button label together — the two
// surfaces cannot drift apart without one of these failing.
describe('bids list and withdraw button, from one store state', () => {
  // The button's `outcome` is read off the store here rather than taken as a parameter, mirroring
  // how production wires it (Bids.tsx selects `state.progress.outcome` and passes it down). That
  // makes divergence unrepresentable: there is no second value a test could set independently, so
  // these cases genuinely establish that the two surfaces agree about the same auction.
  function renderBothSurfaces() {
    return renderHook(() => ({
      list: useBidsListData(),
      button: useWithdrawButtonState({
        outcome: mockStoreState.progress.outcome,
        currentBlockNumber: 300,
      }),
    }))
  }

  beforeEach(() => {
    mockStoreState.userBids = [makeBid()]
    mockStoreState.pendingWithdrawalBidIds = new Set()
    mockStoreState.awaitingConfirmationBidIds = new Set()
  })

  it('genuinely failed: funds-available copy alongside the refund button', () => {
    mockStoreState.progress = { state: AuctionProgressState.ENDED, outcome: AuctionOutcome.FAILED }

    const { result } = renderBothSurfaces()

    expect(result.current.list.bidItems).toHaveLength(1)
    expect(result.current.list.bidItems[0]!.displayState).toBe('fundsAvailable')
    expect(result.current.button.label).toBe('toucan.auction.withdrawFunds')
    expect(result.current.button.isDisabled).toBe(false)
  })

  it('graduated: no funds-available copy, and the button offers tokens rather than a refund', () => {
    mockStoreState.progress = { state: AuctionProgressState.ENDED, outcome: AuctionOutcome.GRADUATED }

    const { result } = renderBothSurfaces()

    expect(result.current.list.bidItems).toHaveLength(1)
    expect(result.current.list.bidItems[0]!.displayState).toBe('inRange')
    expect(result.current.button.label).toBe('toucan.auction.withdrawTokens')
  })

  it('undecided: neither surface makes a claim about the funds', () => {
    mockStoreState.progress = { state: AuctionProgressState.UNKNOWN, outcome: AuctionOutcome.UNKNOWN }

    const { result } = renderBothSurfaces()

    expect(result.current.list.isLoading).toBe(true)
    expect(result.current.list.bidItems).toEqual([])
    expect(result.current.button.label).toBe('common.loading')
    expect(result.current.button.isDisabled).toBe(true)
  })
})
