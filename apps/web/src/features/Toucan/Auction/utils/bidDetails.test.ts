import { describe, expect, it } from 'vitest'
import { AuctionBidStatus, AuctionOutcome } from '~/features/Toucan/Auction/store/types'
import { formatTokenAmountWithSubscript, getBidDisplayInfo } from '~/features/Toucan/Auction/utils/bidDetails'

function displayInfo({
  outcome,
  isAuctionInProgress = false,
  bidStatus = AuctionBidStatus.Submitted,
  isInRange = true,
  isFullyFilled = false,
  isInPreClaimWindow = false,
  hasMetThreshold,
}: {
  outcome: AuctionOutcome
  isAuctionInProgress?: boolean
  bidStatus?: AuctionBidStatus
  isInRange?: boolean
  isFullyFilled?: boolean
  isInPreClaimWindow?: boolean
  hasMetThreshold?: boolean
}) {
  return getBidDisplayInfo({
    bidStatus,
    isInRange,
    isFullyFilled,
    isAuctionInProgress,
    outcome,
    isInPreClaimWindow,
    hasMetThreshold,
  })
}

describe('getBidDisplayInfo', () => {
  describe('auction genuinely failed to graduate', () => {
    it('offers the full refund state for an unresolved bid', () => {
      const { displayState, descriptionState } = displayInfo({ outcome: AuctionOutcome.FAILED })

      expect(displayState).toBe('fundsAvailable')
      expect(descriptionState).toBe('overNotGraduated')
    })

    it('reports an already-exited bid as withdrawn', () => {
      const { displayState, descriptionState } = displayInfo({
        outcome: AuctionOutcome.FAILED,
        bidStatus: AuctionBidStatus.Exited,
      })

      expect(displayState).toBe('withdrawn')
      expect(descriptionState).toBe('overNotGraduatedExited')
    })
  })

  describe('auction graduated', () => {
    it('does not claim funds are available', () => {
      const { displayState, descriptionState } = displayInfo({
        outcome: AuctionOutcome.GRADUATED,
        isFullyFilled: true,
      })

      expect(displayState).toBe('complete')
      expect(descriptionState).toBe('completeOver')
    })

    it('uses pre-claim copy inside the pre-claim window', () => {
      const { descriptionState } = displayInfo({
        outcome: AuctionOutcome.GRADUATED,
        isFullyFilled: true,
        isInPreClaimWindow: true,
      })

      expect(descriptionState).toBe('completePreClaim')
    })

    it('reports a claimed bid as withdrawn', () => {
      const { displayState, descriptionState } = displayInfo({
        outcome: AuctionOutcome.GRADUATED,
        bidStatus: AuctionBidStatus.Claimed,
        isFullyFilled: true,
      })

      expect(displayState).toBe('withdrawn')
      expect(descriptionState).toBe('completeClaimed')
    })
  })

  describe('outcome still undecided', () => {
    // The bug this guards: UNKNOWN used to reach the code via `isGraduated === false`, so a bidder
    // on an auction that DID graduate was told their whole budget was refundable.
    it('asserts neither outcome for a bid on an auction whose result is not known yet', () => {
      const { displayState, descriptionState } = displayInfo({
        outcome: AuctionOutcome.UNKNOWN,
      })

      expect(displayState).toBe('pending')
      expect(descriptionState).toBe('awaitingOutcome')
    })

    it('stays undecided even when the bid looks fully filled', () => {
      const { displayState, descriptionState } = displayInfo({
        outcome: AuctionOutcome.UNKNOWN,
        isFullyFilled: true,
      })

      expect(displayState).toBe('pending')
      expect(descriptionState).toBe('awaitingOutcome')
    })
  })

  describe('auction still running', () => {
    it('never shows the failed-auction refund state before the auction ends', () => {
      const { displayState, descriptionState, isAuctionEnded } = displayInfo({
        outcome: AuctionOutcome.ACTIVE,
        isAuctionInProgress: true,
        isInRange: false,
      })

      expect(displayState).toBe('outOfRange')
      expect(descriptionState).toBe('outOfRangeInProgress')
      expect(isAuctionEnded).toBe(false)
    })

    // The contract rejects an early exit until the auction graduates, so the copy must not
    // imply the unused budget is withdrawable yet.
    it('says the unused budget waits on the launch threshold when it is unmet', () => {
      const { displayState, descriptionState } = displayInfo({
        outcome: AuctionOutcome.ACTIVE,
        isAuctionInProgress: true,
        isInRange: false,
        hasMetThreshold: false,
      })

      expect(displayState).toBe('outOfRange')
      expect(descriptionState).toBe('outOfRangeInProgressAwaitingThreshold')
    })

    it('uses the regular out-of-range copy once the threshold is met', () => {
      const { descriptionState } = displayInfo({
        outcome: AuctionOutcome.ACTIVE,
        isAuctionInProgress: true,
        isInRange: false,
        hasMetThreshold: true,
      })

      expect(descriptionState).toBe('outOfRangeInProgress')
    })

    it('uses the regular out-of-range copy while the threshold is undecided', () => {
      const { descriptionState } = displayInfo({
        outcome: AuctionOutcome.ACTIVE,
        isAuctionInProgress: true,
        isInRange: false,
        hasMetThreshold: undefined,
      })

      expect(descriptionState).toBe('outOfRangeInProgress')
    })

    it('never tells an already-refunded bid it is waiting on the threshold', () => {
      const { descriptionState } = displayInfo({
        outcome: AuctionOutcome.ACTIVE,
        isAuctionInProgress: true,
        isInRange: false,
        bidStatus: AuctionBidStatus.Exited,
        hasMetThreshold: false,
      })

      expect(descriptionState).toBe('outOfRangeInProgress')
    })

    it('keeps in-range copy regardless of the threshold', () => {
      const { descriptionState } = displayInfo({
        outcome: AuctionOutcome.ACTIVE,
        isAuctionInProgress: true,
        isInRange: true,
        hasMetThreshold: false,
      })

      expect(descriptionState).toBe('inRangeInProgress')
    })
  })
})

describe('formatTokenAmountWithSubscript', () => {
  it('renders 4+ leading zeros as en-US subscript with a dot separator', () => {
    expect(formatTokenAmountWithSubscript({ raw: 12_345n, decimals: 9, symbol: 'ETH', locale: 'en-US' })).toBe(
      '0.0₄123 ETH',
    )
  })

  it('renders 4+ leading zeros as nl-NL subscript with a comma separator', () => {
    expect(formatTokenAmountWithSubscript({ raw: 12_345n, decimals: 9, symbol: 'ETH', locale: 'nl-NL' })).toBe(
      '0,0₄123 ETH',
    )
  })

  it('formats amounts below the subscript threshold with the locale separators', () => {
    expect(formatTokenAmountWithSubscript({ raw: 123n, decimals: 4, symbol: 'USDC', locale: 'en-US' })).toBe(
      '0.0123 USDC',
    )
    expect(formatTokenAmountWithSubscript({ raw: 123n, decimals: 4, symbol: 'USDC', locale: 'nl-NL' })).toBe(
      '0,0123 USDC',
    )
    expect(formatTokenAmountWithSubscript({ raw: 1_234_500_000n, decimals: 6, symbol: 'USDC', locale: 'en-US' })).toBe(
      '1,234.5 USDC',
    )
    expect(formatTokenAmountWithSubscript({ raw: 1_234_500_000n, decimals: 6, symbol: 'USDC', locale: 'nl-NL' })).toBe(
      '1.234,5 USDC',
    )
    expect(formatTokenAmountWithSubscript({ raw: 5_000_000n, decimals: 6, symbol: 'USDC', locale: 'nl-NL' })).toBe(
      '5 USDC',
    )
    expect(formatTokenAmountWithSubscript({ raw: 0n, decimals: 6, symbol: 'USDC', locale: 'nl-NL' })).toBe('0 USDC')
  })
})
