import { describe, expect, it } from 'vitest'
import { isAuctionFailed } from '~/features/Toucan/Auction/utils/isAuctionFailed'

describe('isAuctionFailed', () => {
  describe('with a served graduation verdict', () => {
    it('returns true when the contract did not graduate, even though committed volume met the threshold', () => {
      // Committed volume counts bids the clearing price never filled; graduation compares filled volume.
      expect(
        isAuctionFailed({
          phase: 'completed',
          isGraduated: false,
          totalBidVolume: '1000',
          requiredCurrencyRaised: '500',
        }),
      ).toBe(true)
    })

    it('returns false when the contract graduated, whatever committed volume says', () => {
      expect(
        isAuctionFailed({
          phase: 'completed',
          isGraduated: true,
          totalBidVolume: '100',
          requiredCurrencyRaised: '500',
        }),
      ).toBe(false)
    })

    it('returns false for any non-completed phase, even when not graduated', () => {
      expect(isAuctionFailed({ phase: 'live', isGraduated: false })).toBe(false)
      expect(isAuctionFailed({ phase: undefined, isGraduated: false })).toBe(false)
    })

    it('needs no threshold to report a failure', () => {
      expect(isAuctionFailed({ phase: 'completed', isGraduated: false })).toBe(true)
    })
  })

  it('returns true when a completed auction ended below the launch threshold', () => {
    expect(isAuctionFailed({ phase: 'completed', totalBidVolume: '100', requiredCurrencyRaised: '500' })).toBe(true)
  })

  it('returns false when committed volume meets the launch threshold and no verdict is served', () => {
    expect(isAuctionFailed({ phase: 'completed', totalBidVolume: '500', requiredCurrencyRaised: '500' })).toBe(false)
  })

  it('returns false when committed volume exceeds the launch threshold', () => {
    expect(isAuctionFailed({ phase: 'completed', totalBidVolume: '1000', requiredCurrencyRaised: '500' })).toBe(false)
  })

  it('returns false for any non-completed phase, even below the threshold', () => {
    expect(isAuctionFailed({ phase: 'notStarted', totalBidVolume: '100', requiredCurrencyRaised: '500' })).toBe(false)
    expect(isAuctionFailed({ phase: 'preBid', totalBidVolume: '100', requiredCurrencyRaised: '500' })).toBe(false)
    expect(isAuctionFailed({ phase: 'live', totalBidVolume: '100', requiredCurrencyRaised: '500' })).toBe(false)
    expect(isAuctionFailed({ phase: undefined, totalBidVolume: '100', requiredCurrencyRaised: '500' })).toBe(false)
  })

  it('treats a missing committed volume as zero', () => {
    expect(isAuctionFailed({ phase: 'completed', totalBidVolume: undefined, requiredCurrencyRaised: '500' })).toBe(true)
  })

  it('returns false when the threshold is missing, empty, or zero', () => {
    expect(isAuctionFailed({ phase: 'completed', totalBidVolume: '100', requiredCurrencyRaised: undefined })).toBe(
      false,
    )
    expect(isAuctionFailed({ phase: 'completed', totalBidVolume: '100', requiredCurrencyRaised: '' })).toBe(false)
    expect(isAuctionFailed({ phase: 'completed', totalBidVolume: '100', requiredCurrencyRaised: '0' })).toBe(false)
  })

  it('returns false when the threshold is malformed', () => {
    expect(isAuctionFailed({ phase: 'completed', totalBidVolume: '100', requiredCurrencyRaised: 'not-a-number' })).toBe(
      false,
    )
  })
})
