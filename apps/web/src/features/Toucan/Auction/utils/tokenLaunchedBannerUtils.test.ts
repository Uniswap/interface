import { describe, expect, it } from 'vitest'
import {
  getTokenLaunchTradeAvailabilityBlock,
  isTokenLaunchTradeAvailable,
  isTokenLaunchTradeLive,
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
        migrationBlock: '300',
      }),
    ).toBeUndefined()
  })

  it('returns the claim block when it is later than the migration block', () => {
    expect(
      getTokenLaunchTradeAvailabilityBlock({
        claimBlock: '200',
        hasLbpStrategyAddress: true,
        migrationBlock: '123',
      }),
    ).toBe(200)
  })

  it('returns the migration block when it is later than the claim block', () => {
    expect(
      getTokenLaunchTradeAvailabilityBlock({
        claimBlock: '200',
        hasLbpStrategyAddress: true,
        migrationBlock: '300',
      }),
    ).toBe(300)
  })

  it('returns the migration block when the claim block is unavailable', () => {
    expect(
      getTokenLaunchTradeAvailabilityBlock({
        claimBlock: undefined,
        hasLbpStrategyAddress: true,
        migrationBlock: '300',
      }),
    ).toBe(300)
  })
})

describe('isTokenLaunchTradeAvailable', () => {
  it('returns false for failed (ungraduated) auctions', () => {
    expect(
      isTokenLaunchTradeAvailable({
        claimBlock: undefined,
        currentBlockNumber: 10,
        hasLbpStrategyAddress: true,
        isGraduated: false,
        hasMigrated: false,
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
        hasMigrated: false,
      }),
    ).toBe(true)
  })

  it('returns false for LBP graduated auctions that have not migrated yet', () => {
    expect(
      isTokenLaunchTradeAvailable({
        claimBlock: '200',
        currentBlockNumber: 5000,
        hasLbpStrategyAddress: true,
        isGraduated: true,
        hasMigrated: false,
      }),
    ).toBe(false)
  })

  it('returns false for a migrated LBP auction before its claim block', () => {
    expect(
      isTokenLaunchTradeAvailable({
        claimBlock: '200',
        currentBlockNumber: 150,
        hasLbpStrategyAddress: true,
        isGraduated: true,
        hasMigrated: true,
      }),
    ).toBe(false)
  })

  it('returns true for a migrated LBP auction once the claim block has passed', () => {
    expect(
      isTokenLaunchTradeAvailable({
        claimBlock: '200',
        currentBlockNumber: 200,
        hasLbpStrategyAddress: true,
        isGraduated: true,
        hasMigrated: true,
      }),
    ).toBe(true)
  })

  it('returns true for a migrated LBP auction when no claim block is set', () => {
    expect(
      isTokenLaunchTradeAvailable({
        claimBlock: undefined,
        currentBlockNumber: undefined,
        hasLbpStrategyAddress: true,
        isGraduated: true,
        hasMigrated: true,
      }),
    ).toBe(true)
  })
})

describe('isTokenLaunchTradeLive', () => {
  it('is live when status permits trading and a market price exists', () => {
    expect(
      isTokenLaunchTradeLive({
        isTradeAvailableFromStatus: true,
        hasLiveMarketPrice: true,
      }),
    ).toBe(true)
  })

  it('is not live when status permits trading but no pool/market price exists (0% LP case)', () => {
    expect(
      isTokenLaunchTradeLive({
        isTradeAvailableFromStatus: true,
        hasLiveMarketPrice: false,
      }),
    ).toBe(false)
  })

  it('is not live when status does not permit trading even if a market price exists', () => {
    expect(
      isTokenLaunchTradeLive({
        isTradeAvailableFromStatus: false,
        hasLiveMarketPrice: true,
      }),
    ).toBe(false)
  })

  it('is not live when neither status nor market price allow trading', () => {
    expect(
      isTokenLaunchTradeLive({
        isTradeAvailableFromStatus: false,
        hasLiveMarketPrice: false,
      }),
    ).toBe(false)
  })
})
