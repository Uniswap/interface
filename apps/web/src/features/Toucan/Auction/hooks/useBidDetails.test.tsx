import { renderHook } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBidDetails } from '~/features/Toucan/Auction/hooks/useBidDetails'
import type { AuctionDetails, BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { AuctionBidStatus, AuctionOutcome, AuctionProgressState, UserBid } from '~/features/Toucan/Auction/store/types'

// 1.0 in Q96 fixed point — keeps the FDV/price math well-defined without dominating the fixtures.
const ONE_Q96 = '79228162514264337593543950336'
const CLAIM_BLOCK = '200'

const mockStoreState = {
  pendingWithdrawalBidIds: new Set<string>(),
  awaitingConfirmationBidIds: new Set<string>(),
  // Below CLAIM_BLOCK, so an ended+graduated auction is inside its pre-claim window by default.
  currentBlockNumber: 100 as number | undefined,
}

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))
vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    formatNumberOrString: ({ value }: { value: unknown }) => String(value),
    convertFiatAmountFormatted: (value: number) => String(value),
  }),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  // Rendered copy is not exercised here; the i18n key is the assertable identity of the sentence.
  Trans: () => null,
}))

const bidTokenInfo: BidTokenInfo = {
  symbol: 'ETH',
  decimals: 18,
  priceFiat: 2000,
  isStablecoin: false,
  logoUrl: null,
}

const auctionDetails = {
  auctionId: 'auction-1',
  claimBlock: CLAIM_BLOCK,
  tokenSymbol: 'TKN',
  tokenTotalSupply: '1000000000000000000000',
  requiredCurrencyRaised: '2687499999999999999',
  token: { currency: { symbol: 'TKN', name: 'Token', decimals: 18 } },
} as unknown as AuctionDetails

function makeBid(overrides: Partial<UserBid> = {}): UserBid {
  return {
    bidId: 'bid-1',
    auctionId: 'auction-1',
    walletId: '0x1111111111111111111111111111111111111111',
    txHash: '0xabc',
    amount: '1000000000000000000',
    maxPrice: ONE_Q96,
    createdAt: '2026-07-01T00:00:00Z',
    status: AuctionBidStatus.Submitted,
    baseTokenInitial: '1000000000000000000',
    currencySpent: '500000000000000000',
    ...overrides,
  }
}

function renderBidDetails({
  outcome,
  auctionProgressState = AuctionProgressState.ENDED,
  hasMetThreshold,
  isInRange = true,
  bid = makeBid(),
  details = auctionDetails,
}: {
  outcome: AuctionOutcome
  auctionProgressState?: AuctionProgressState
  /** Stated by every case rather than derived from `outcome`: the two are independent inputs. */
  hasMetThreshold: boolean | undefined
  isInRange?: boolean
  bid?: UserBid
  details?: AuctionDetails
}) {
  return renderHook(() =>
    useBidDetails({
      bid,
      isInRange,
      bidTokenInfo,
      auctionDetails: details,
      clearingPrice: ONE_Q96,
      outcome,
      hasMetThreshold,
      auctionProgressState,
    }),
  )
}

/** The i18n key of the description sentence, i.e. which copy the bidder is actually shown. */
function descriptionKey(description: unknown): string | null {
  if (description === null || description === undefined) {
    return null
  }
  return ((description as ReactElement).props as { i18nKey: string }).i18nKey
}

/** The values interpolated into the description sentence — `Trans` is mocked, so this is the copy the bidder reads. */
function descriptionValues(description: unknown): Record<string, unknown> | undefined {
  return ((description as ReactElement).props as { values?: Record<string, unknown> }).values
}

describe('useBidDetails', () => {
  beforeEach(() => {
    mockStoreState.pendingWithdrawalBidIds = new Set()
    mockStoreState.awaitingConfirmationBidIds = new Set()
    mockStoreState.currentBlockNumber = 100
  })

  describe('auction genuinely failed to graduate', () => {
    it('tells the bidder their funds are available', () => {
      const { result } = renderBidDetails({ outcome: AuctionOutcome.FAILED, hasMetThreshold: false })

      expect(result.current.displayState).toBe('fundsAvailable')
      expect(descriptionKey(result.current.description)).toBe('toucan.bidDetails.description.overNotGraduated')
    })

    it('uses the already-refunded copy once the bid has exited', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.FAILED,
        hasMetThreshold: false,
        bid: makeBid({ status: AuctionBidStatus.Exited }),
      })

      expect(result.current.displayState).toBe('withdrawn')
      expect(descriptionKey(result.current.description)).toBe('toucan.bidDetails.description.overNotGraduatedExited')
    })
  })

  describe('auction graduated', () => {
    it('uses graduated copy and never claims the funds are refundable', () => {
      mockStoreState.currentBlockNumber = 300 // past CLAIM_BLOCK, so not in the pre-claim window

      const { result } = renderBidDetails({
        outcome: AuctionOutcome.GRADUATED,
        hasMetThreshold: true,
        bid: makeBid({ currencySpent: '1000000000000000000' }), // fully filled
      })

      expect(result.current.displayState).toBe('complete')
      expect(descriptionKey(result.current.description)).toBe('toucan.bidDetails.description.completeOver')
    })

    it('offers the unused-budget refund for an out-of-range bid inside the pre-claim window', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.GRADUATED,
        hasMetThreshold: true,
        isInRange: false,
      })

      expect(result.current.buttonState).toEqual({
        isEnabled: true,
        isVisible: true,
        label: 'toucan.auction.refundUnusedBudget',
        action: 'exit',
      })
      expect(descriptionKey(result.current.description)).toBe('toucan.bidDetails.description.outOfRangePreClaim')
    })
  })

  // The bug this guards: an undecided outcome used to reach this hook as `isGraduated === false`,
  // so a bidder on an auction that DID graduate was shown 'fundsAvailable' and told it never
  // launched. Undecided must assert nothing about the money and must offer no action.
  describe('outcome still undecided', () => {
    it('shows no refund-available copy and no description at all', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.UNKNOWN,
        auctionProgressState: AuctionProgressState.UNKNOWN,
        hasMetThreshold: false,
      })

      expect(result.current.displayState).toBe('pending')
      expect(result.current.description).toBeNull()
    })

    it('stays undecided even when the threshold has already been met', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.UNKNOWN,
        auctionProgressState: AuctionProgressState.UNKNOWN,
        hasMetThreshold: true,
      })

      expect(result.current.displayState).toBe('pending')
      expect(result.current.description).toBeNull()
    })

    it('exposes no withdraw or refund action', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.UNKNOWN,
        auctionProgressState: AuctionProgressState.UNKNOWN,
        hasMetThreshold: false,
        isInRange: false,
      })

      expect(result.current.buttonState.isVisible).toBe(false)
      expect(result.current.buttonState.isEnabled).toBe(false)
    })
  })

  // `hasMetThreshold` is deliberately separate from `outcome`: graduation can latch before the end
  // block, so `outcome` is ACTIVE here and cannot express "threshold met". This is the path most at
  // risk when the `isGraduated` boolean is eventually deleted.
  describe('mid-auction, graduation threshold already met', () => {
    it('offers the unused-budget refund for an out-of-range bid', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.ACTIVE,
        auctionProgressState: AuctionProgressState.IN_PROGRESS,
        hasMetThreshold: true,
        isInRange: false,
      })

      expect(result.current.buttonState).toEqual({
        isEnabled: true,
        isVisible: true,
        label: 'toucan.auction.refundUnusedBudget',
        action: 'exit',
      })
      expect(descriptionKey(result.current.description)).toBe('toucan.bidDetails.description.outOfRangeInProgress')
    })

    it('hides the refund action while the threshold is unmet, and says why', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.ACTIVE,
        auctionProgressState: AuctionProgressState.IN_PROGRESS,
        hasMetThreshold: false,
        isInRange: false,
      })

      expect(result.current.buttonState.isVisible).toBe(false)
      expect(descriptionKey(result.current.description)).toBe(
        'toucan.bidDetails.description.outOfRangeInProgressAwaitingThreshold',
      )
      expect(descriptionValues(result.current.description)).toMatchObject({ launchThreshold: '2.69 ETH' })
      expect(descriptionValues(result.current.description)).toHaveProperty('valuationSummary')
    })

    // Undecided (checkpoint loading or errored) must not claim the threshold is unmet: the auction
    // may already have graduated.
    it('keeps the default copy and hides the refund action while the threshold is undecided', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.ACTIVE,
        auctionProgressState: AuctionProgressState.IN_PROGRESS,
        hasMetThreshold: undefined,
        isInRange: false,
      })

      expect(result.current.buttonState.isVisible).toBe(false)
      expect(descriptionKey(result.current.description)).toBe('toucan.bidDetails.description.outOfRangeInProgress')
    })

    it('falls back to a placeholder when the launch threshold is missing', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.ACTIVE,
        auctionProgressState: AuctionProgressState.IN_PROGRESS,
        hasMetThreshold: false,
        isInRange: false,
        details: { ...auctionDetails, requiredCurrencyRaised: '' } as AuctionDetails,
      })

      expect(descriptionValues(result.current.description)).toMatchObject({ launchThreshold: '-' })
    })

    it('keeps the refund action hidden for an in-range bid even with the threshold met', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.ACTIVE,
        auctionProgressState: AuctionProgressState.IN_PROGRESS,
        hasMetThreshold: true,
        isInRange: true,
      })

      expect(result.current.buttonState.isVisible).toBe(false)
    })

    it('disables the refund action while that bid has a withdrawal in flight', () => {
      mockStoreState.pendingWithdrawalBidIds = new Set(['bid-1'])

      const { result } = renderBidDetails({
        outcome: AuctionOutcome.ACTIVE,
        auctionProgressState: AuctionProgressState.IN_PROGRESS,
        hasMetThreshold: true,
        isInRange: false,
      })

      expect(result.current.buttonState.isVisible).toBe(true)
      expect(result.current.buttonState.isEnabled).toBe(false)
    })
  })
  // The FDV figures are the whole token supply times a price, so without `tokenTotalSupply` there is
  // no valuation to state. It arrives as null whenever the upstream RPC call for it fails, and the
  // loader deliberately does not substitute the auctioned slice — that substitution understated FDV
  // on existing-token auctions by the full-supply/auctioned-slice ratio.
  describe('token total supply unavailable', () => {
    const detailsWithoutTotalSupply = { ...auctionDetails, tokenTotalSupply: undefined } as AuctionDetails

    it('states no FDV rather than a confident zero', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.ACTIVE,
        auctionProgressState: AuctionProgressState.IN_PROGRESS,
        hasMetThreshold: false,
        details: detailsWithoutTotalSupply,
      })

      // `0n` used to reach the compact formatter and render as "0 ETH" — a real valuation of zero.
      expect(result.current.currentFdvDisplay).toBe('-')
      expect(result.current.maxFdvDisplay).toBe('-')
    })

    it('leaves the FDV range marker unplaced instead of pinning it at the low end', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.ACTIVE,
        auctionProgressState: AuctionProgressState.IN_PROGRESS,
        hasMetThreshold: false,
        details: detailsWithoutTotalSupply,
      })

      expect(result.current.fdvFraction).toBeNull()
    })

    // Known copy gap: the sentence reads "…goes over -", which is honest but reads as a typo. Rewording
    // it needs a new translated string, so the placeholder is pinned here rather than left unstated.
    it('interpolates the placeholder into the description sentence', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.ACTIVE,
        auctionProgressState: AuctionProgressState.IN_PROGRESS,
        hasMetThreshold: false,
        details: detailsWithoutTotalSupply,
      })

      expect(descriptionKey(result.current.description)).toBe('toucan.bidDetails.description.inRangeInProgress')
      expect(descriptionValues(result.current.description)).toMatchObject({ valuationSummary: '-' })
    })

    it('still reports both FDV figures when the supply is present', () => {
      const { result } = renderBidDetails({
        outcome: AuctionOutcome.ACTIVE,
        auctionProgressState: AuctionProgressState.IN_PROGRESS,
        hasMetThreshold: false,
      })

      // 1000 tokens at a Q96 price of 1.0 — the placeholder path must not swallow a real valuation.
      expect(result.current.currentFdvDisplay).toBe('1K ETH')
      expect(result.current.maxFdvDisplay).toBe('1K ETH')
      expect(result.current.fdvFraction).toBe(1)
    })
  })
})
