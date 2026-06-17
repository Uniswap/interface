import { describe, expect, it } from 'vitest'
import {
  getTokenLaunchTradeAvailabilityBlock,
  isTokenLaunchTradeAvailable,
  shouldShowTokenLaunchedBanner,
} from '~/features/Toucan/Auction/utils/tokenLaunchedBannerUtils'

describe('shouldShowTokenLaunchedBanner', () => {
  it('returns false before the auction ends', () => {
    expect(
      shouldShowTokenLaunchedBanner({
        isAuctionEnded: false,
      }),
    ).toBe(false)
  })

  it('returns true after the auction ends', () => {
    expect(
      shouldShowTokenLaunchedBanner({
        isAuctionEnded: true,
      }),
    ).toBe(true)
  })
})

describe('getTokenLaunchTradeAvailabilityBlock', () => {
  it('returns undefined for non-LBP auctions', () => {
    expect(
      getTokenLaunchTradeAvailabilityBlock({
        claimBlock: '200',
        hasLbpStrategyAddress: false,
        migrationBlock: 300n,
      }),
    ).toBeUndefined()
  })

  it('returns the claim block when it is later than the migration block', () => {
    expect(
      getTokenLaunchTradeAvailabilityBlock({
        claimBlock: '200',
        hasLbpStrategyAddress: true,
        migrationBlock: 123n,
      }),
    ).toBe(200)
  })

  it('returns the migration block when it is later than the claim block', () => {
    expect(
      getTokenLaunchTradeAvailabilityBlock({
        claimBlock: '200',
        hasLbpStrategyAddress: true,
        migrationBlock: 300n,
      }),
    ).toBe(300)
  })

  it('returns the migration block when the claim block is unavailable', () => {
    expect(
      getTokenLaunchTradeAvailabilityBlock({
        claimBlock: undefined,
        hasLbpStrategyAddress: true,
        migrationBlock: 300n,
      }),
    ).toBe(300)
  })
})

describe('isTokenLaunchTradeAvailable', () => {
  it('returns false for failed auctions', () => {
    expect(
      isTokenLaunchTradeAvailable({
        claimBlock: undefined,
        currentBlockNumber: 10,
        hasLbpStrategyAddress: true,
        isGraduated: false,
        migrationBlock: undefined,
      }),
    ).toBe(false)
  })

  it('keeps the existing trade behavior for non-LBP graduated auctions', () => {
    expect(
      isTokenLaunchTradeAvailable({
        claimBlock: undefined,
        currentBlockNumber: undefined,
        hasLbpStrategyAddress: false,
        isGraduated: true,
        migrationBlock: undefined,
      }),
    ).toBe(true)
  })

  it('returns false for LBP graduated auctions while the current block is unavailable', () => {
    expect(
      isTokenLaunchTradeAvailable({
        claimBlock: undefined,
        currentBlockNumber: undefined,
        hasLbpStrategyAddress: true,
        isGraduated: true,
        migrationBlock: 123n,
      }),
    ).toBe(false)
  })

  it('returns false for LBP graduated auctions before the migration block', () => {
    expect(
      isTokenLaunchTradeAvailable({
        claimBlock: undefined,
        currentBlockNumber: 122,
        hasLbpStrategyAddress: true,
        isGraduated: true,
        migrationBlock: 123n,
      }),
    ).toBe(false)
  })

  it('returns false for LBP graduated auctions before the claim block even after migration', () => {
    expect(
      isTokenLaunchTradeAvailable({
        claimBlock: '200',
        currentBlockNumber: 150,
        hasLbpStrategyAddress: true,
        isGraduated: true,
        migrationBlock: 123n,
      }),
    ).toBe(false)
  })

  it('returns true for LBP graduated auctions once migration and claim blocks have passed', () => {
    expect(
      isTokenLaunchTradeAvailable({
        claimBlock: '200',
        currentBlockNumber: 200,
        hasLbpStrategyAddress: true,
        isGraduated: true,
        migrationBlock: 123n,
      }),
    ).toBe(true)
  })
})
